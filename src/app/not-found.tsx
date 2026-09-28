import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="velvet-bg grain flex min-h-[100svh] items-center justify-center px-6 text-center">
      <div className="max-w-xl">
        <Heart className="mx-auto size-10 text-[#7d4053]" strokeWidth={1.3} />
        <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.3em] text-[#a76d7f]">История завершилась</p>
        <h1 className="font-display mt-4 text-6xl font-semibold leading-[0.92] sm:text-8xl">Некоторые моменты<br />живут недолго</h1>
        <p className="mx-auto mt-6 max-w-sm text-sm leading-7 text-[#a78f96]">Ссылка могла истечь или быть написана с ошибкой. Но всегда можно создать новую историю.</p>
        <Button asChild variant="outline" className="mt-8"><a href="/create">Создать свою открытку</a></Button>
      </div>
    </main>
  );
}
