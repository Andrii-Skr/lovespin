import type { Metadata } from "next";
import { DemoReady } from "@/app/demo/demo-ready";
import { demoData, isGameLocale } from "@/components/game/game-copy";
import { LoveGame } from "@/components/game/love-game";

export const metadata: Metadata = {
  title: "LoveSpin demo",
  robots: { index: false, follow: false },
};

type DemoPageProps = { searchParams: Promise<{ lang?: string | string[] }> };

export default async function DemoPage({ searchParams }: DemoPageProps) {
  const { lang } = await searchParams;
  const locale = isGameLocale(lang) ? lang : "ru";

  return <>
    <DemoReady />
    <LoveGame data={demoData[locale]} locale={locale} />
  </>;
}
