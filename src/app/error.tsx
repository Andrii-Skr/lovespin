"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="velvet-bg flex min-h-[100svh] items-center justify-center px-6 text-center">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d48aa0]">Что-то сбилось</p>
        <h1 className="font-display mt-4 text-6xl font-semibold">Попробуем ещё раз?</h1>
        <Button variant="outline" className="mt-7" onClick={reset}>Вернуться к истории</Button>
      </div>
    </main>
  );
}
