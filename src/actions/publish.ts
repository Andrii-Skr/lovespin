"use server";

import { createHmac } from "node:crypto";
import fs from "node:fs/promises";
import { headers } from "next/headers";
import sharp from "sharp";
import { hasPdfSignature, isPdfFileMetadata } from "@/lib/certificate";
import { getClientIp } from "@/lib/client-ip";
import { sql } from "@/lib/db";
import { lovePageSchema, photoCropSchema } from "@/lib/love-page-schema";
import { DEFAULT_PHOTO_CROP, getPhotoRenderPlan } from "@/lib/photo-crop";
import { verifyTurnstile } from "@/lib/turnstile";
import { createShareSlug } from "@/lib/share-slug";

export type PublishState = {
  status: "idle" | "error" | "success";
  message?: string;
  slug?: string;
  expiresAt?: string;
  fieldErrors?: Record<string, string[]>;
};

const allowedPhotoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxPhotoPixels = 50_000_000;
const publishRateLimitDisabled =
  process.env.NODE_ENV !== "production" &&
  process.env.DISABLE_PUBLISH_RATE_LIMIT === "true";

function hashIp(ip: string) {
  const secret = process.env.IP_HASH_SECRET;
  if (!secret) throw new Error("IP_HASH_SECRET is not configured");
  return createHmac("sha256", secret).update(ip).digest("hex");
}

class PublishLimitError extends Error {}

const publishLimitMessage = "Лимит публикаций достигнут: до 3 в час и до 10 в сутки";
const publishFailureMessage = "Не удалось создать ссылку. Попробуйте позже";

export async function publishLovePage(formData: FormData): Promise<PublishState> {
  const parsed = lovePageSchema.safeParse({
    recipientName: formData.get("recipientName"),
    introText: formData.get("introText"),
    complimentOne: formData.get("complimentOne"),
    complimentTwo: formData.get("complimentTwo"),
    prizeTitle: formData.get("prizeTitle"),
    prizeMessage: formData.get("prizeMessage"),
    senderName: formData.get("senderName"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Проверьте заполненные поля",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const parsedCrop = photoCropSchema.safeParse({
    x: formData.get("photoCropX") ?? DEFAULT_PHOTO_CROP.x,
    y: formData.get("photoCropY") ?? DEFAULT_PHOTO_CROP.y,
    zoom: formData.get("photoCropZoom") ?? DEFAULT_PHOTO_CROP.zoom,
  });
  if (!parsedCrop.success) {
    return { status: "error", message: "Проверьте положение фотографии" };
  }

  const photoEntry = formData.get("photo");
  const photo = photoEntry instanceof File && photoEntry.size > 0 ? photoEntry : null;
  if (photo && (photo.size > 5 * 1024 * 1024 || !allowedPhotoTypes.has(photo.type))) {
    return {
      status: "error",
      message: "Фото должно быть JPEG, PNG или WebP размером до 5 МБ",
    };
  }

  const certificateEntry = formData.get("certificate");
  const certificate =
    certificateEntry instanceof File && certificateEntry.size > 0
      ? certificateEntry
      : null;
  if ((photo ? 1 : 0) + (certificate ? 1 : 0) !== 1) {
    return { status: "error", message: "Добавьте фотографию или PDF-сертификат" };
  }
  if (certificate && !isPdfFileMetadata(certificate)) {
    return {
      status: "error",
      message: "Сертификат должен быть PDF-файлом размером до 10 МБ",
    };
  }

  const requestHeaders = await headers();
  const clientIp = getClientIp(requestHeaders);
  const turnstileToken = String(formData.get("turnstileToken") ?? "");
  const captchaPassed = await verifyTurnstile(
    turnstileToken,
    clientIp === "unknown" ? undefined : clientIp,
  );
  if (!captchaPassed) {
    return {
      status: "error",
      message: "Не удалось пройти проверку. Обновите её и попробуйте ещё раз",
    };
  }

  let ipHash = "";
  try {
    if (!publishRateLimitDisabled) {
      ipHash = hashIp(clientIp);
      // Reject exhausted clients before decoding or resizing uploaded images.
      // The locked check inside the transaction still prevents concurrent overuse.
      const [limits] = await sql`
        select
          count(*) filter (where created_at > now() - interval '1 hour')::int as hour_count,
          count(*) filter (where created_at > now() - interval '1 day')::int as day_count
        from publish_events
        where ip_hash = ${ipHash}
          and created_at > now() - interval '1 day'
      `;
      if (Number(limits.hour_count) >= 3 || Number(limits.day_count) >= 10) {
        return { status: "error", message: publishLimitMessage };
      }
    }
  } catch (error) {
    console.error("Failed to check publish limit", error);
    return { status: "error", message: publishFailureMessage };
  }

  let photoBuffer: Buffer | null = null;
  let certificateBuffer: Buffer | null = null;
  if (photo) {
    try {
      const orientedPhoto = await sharp(Buffer.from(await photo.arrayBuffer()), {
        limitInputPixels: maxPhotoPixels,
      })
        .rotate()
        .toBuffer({ resolveWithObject: true });
      const outputSize = { width: 1200, height: 1500 };
      const renderPlan = getPhotoRenderPlan(
        { width: orientedPhoto.info.width, height: orientedPhoto.info.height },
        parsedCrop.data,
        outputSize,
      );
      const renderedPhoto = await sharp(orientedPhoto.data)
        .extract(renderPlan.source)
        .resize({
          width: renderPlan.destination.width,
          height: renderPlan.destination.height,
          fit: "fill",
        })
        .png()
        .toBuffer();

      photoBuffer = await sharp({
        create: {
          width: outputSize.width,
          height: outputSize.height,
          channels: 3,
          background: "#32131d",
        },
      })
        .composite([
          {
            input: renderedPhoto,
            left: renderPlan.destination.left,
            top: renderPlan.destination.top,
          },
        ])
        .webp({ quality: 84, effort: 4 })
        .toBuffer();
    } catch {
      return { status: "error", message: "Фото слишком большое или повреждено" };
    }
  }

  if (certificate) {
    certificateBuffer = Buffer.from(await certificate.arrayBuffer());
    if (!hasPdfSignature(certificateBuffer)) {
      return { status: "error", message: "Файл не удалось распознать как PDF" };
    }
  }

  const uploadDir = process.env.UPLOAD_DIR?.startsWith("/")
    ? process.env.UPLOAD_DIR
    : "/tmp/lovespin-uploads";
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (error) {
    console.error("Failed to prepare upload directory", error);
    return { status: "error", message: publishFailureMessage };
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const slug = createShareSlug();
    const photoPath = photoBuffer ? `${slug}.webp` : null;
    const absolutePhotoPath = photoPath ? `${uploadDir}/${photoPath}` : null;
    const certificatePath = certificateBuffer ? `${slug}.pdf` : null;
    const absoluteCertificatePath = certificatePath
      ? `${uploadDir}/${certificatePath}`
      : null;
    let wrotePhoto = false;
    let wroteCertificate = false;

    try {
      const result = await sql.begin(async (tx) => {
        if (!publishRateLimitDisabled) {
          await tx`select pg_advisory_xact_lock(hashtext(${ipHash}))`;
          const [limits] = await tx`
            select
              count(*) filter (where created_at > now() - interval '1 hour')::int as hour_count,
              count(*) filter (where created_at > now() - interval '1 day')::int as day_count
            from publish_events
            where ip_hash = ${ipHash}
              and created_at > now() - interval '1 day'
          `;

          if (Number(limits.hour_count) >= 3 || Number(limits.day_count) >= 10) {
            throw new PublishLimitError();
          }
        }

        if (photoBuffer && absolutePhotoPath) {
          await fs.writeFile(absolutePhotoPath, photoBuffer, { flag: "wx" });
          wrotePhoto = true;
        }
        if (certificateBuffer && absoluteCertificatePath) {
          await fs.writeFile(absoluteCertificatePath, certificateBuffer, { flag: "wx" });
          wroteCertificate = true;
        }

        const [page] = await tx`
          insert into love_pages (
            slug, recipient_name, intro_text, compliment_one, compliment_two,
            prize_title, prize_message, sender_name, photo_path,
            certificate_path, certificate_name
          ) values (
            ${slug}, ${parsed.data.recipientName}, ${parsed.data.introText},
            ${parsed.data.complimentOne}, ${parsed.data.complimentTwo},
            ${parsed.data.prizeTitle}, ${parsed.data.prizeMessage},
            ${parsed.data.senderName}, ${photoPath}, ${certificatePath},
            ${certificate?.name ?? null}
          )
          returning slug, expires_at
        `;
        if (!publishRateLimitDisabled) {
          await tx`insert into publish_events (ip_hash) values (${ipHash})`;
        }
        return page;
      });

      return {
        status: "success",
        slug: result.slug,
        expiresAt: new Date(result.expires_at).toISOString(),
      };
    } catch (error) {
      if (wrotePhoto && absolutePhotoPath) {
        await fs.unlink(absolutePhotoPath).catch(() => undefined);
      }
      if (wroteCertificate && absoluteCertificatePath) {
        await fs.unlink(absoluteCertificatePath).catch(() => undefined);
      }
      if (error instanceof PublishLimitError) {
        return {
          status: "error",
          message: publishLimitMessage,
        };
      }
      const code = error instanceof Error && "code" in error ? error.code : undefined;
      if (attempt < 2 && (code === "23505" || code === "EEXIST")) continue;
      console.error("Failed to publish love page", error);
      return { status: "error", message: publishFailureMessage };
    }
  }

  return { status: "error", message: publishFailureMessage };
}
