import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LoveGame } from "@/components/game/love-game";
import { sql } from "@/lib/db";
import type { LovePageInput } from "@/lib/love-page-schema";
import { isShareSlug } from "@/lib/share-slug";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Для тебя — кое-что особенное",
  description: "Три вращения, в которых невозможно проиграть.",
  robots: { index: false, follow: false, nocache: true },
  openGraph: {
    title: "Для тебя 💌",
    description: "Кое-кто приготовил для тебя маленькое чудо.",
    type: "website",
  },
};

type PageProps = { params: Promise<{ slug: string }> };

export default async function PublishedLovePage({ params }: PageProps) {
  const { slug } = await params;
  if (!isShareSlug(slug)) notFound();

  const [page] = await sql`
    select
      recipient_name, intro_text, compliment_one, compliment_two,
      prize_title, prize_message, sender_name, photo_path, certificate_name
    from love_pages
    where slug = ${slug} and expires_at > now()
    limit 1
  `;

  if (!page) notFound();

  const data: LovePageInput = {
    recipientName: page.recipient_name,
    introText: page.intro_text,
    complimentOne: page.compliment_one,
    complimentTwo: page.compliment_two,
    prizeTitle: page.prize_title,
    prizeMessage: page.prize_message,
    senderName: page.sender_name,
  };

  return (
    <LoveGame
      data={data}
      photoUrl={page.photo_path ? `/media/${slug}` : undefined}
      certificateUrl={page.certificate_name ? `/certificate/${slug}` : undefined}
      certificateName={page.certificate_name ?? undefined}
    />
  );
}
