import fs from "node:fs/promises";
import { sql } from "@/lib/db";
import { isShareSlug } from "@/lib/share-slug";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  if (!isShareSlug(slug)) return new Response(null, { status: 404 });

  const [page] = await sql`
    select photo_path
    from love_pages
    where slug = ${slug} and expires_at > now()
    limit 1
  `;
  if (!page) return new Response(null, { status: 404 });

  if (page.photo_path !== `${slug}.webp`) {
    return new Response(null, { status: 404 });
  }
  const uploadDir = process.env.UPLOAD_DIR?.startsWith("/")
    ? process.env.UPLOAD_DIR
    : "/tmp/lovespin-uploads";
  const filePath = `${uploadDir}/${page.photo_path}`;

  try {
    const image = await fs.readFile(filePath);
    return new Response(image, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
