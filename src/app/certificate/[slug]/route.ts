import fs from "node:fs/promises";
import { sql } from "@/lib/db";
import { isShareSlug } from "@/lib/share-slug";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  if (!isShareSlug(slug)) return new Response(null, { status: 404 });

  const [page] = await sql`
    select certificate_path, certificate_name
    from love_pages
    where slug = ${slug} and expires_at > now()
    limit 1
  `;
  if (!page?.certificate_path || !page.certificate_name) {
    return new Response(null, { status: 404 });
  }

  if (page.certificate_path !== `${slug}.pdf`) {
    return new Response(null, { status: 404 });
  }

  const uploadDir = process.env.UPLOAD_DIR?.startsWith("/")
    ? process.env.UPLOAD_DIR
    : "/tmp/lovespin-uploads";

  try {
    const pdf = await fs.readFile(`${uploadDir}/${page.certificate_path}`);
    const encodedName = encodeURIComponent(page.certificate_name).replace(
      /['()*]/g,
      (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
    );
    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="certificate.pdf"; filename*=UTF-8''${encodedName}`,
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Security-Policy": "sandbox; default-src 'none'",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
