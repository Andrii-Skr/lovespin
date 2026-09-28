import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  suppressHydrationWarning = true,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      suppressHydrationWarning={suppressHydrationWarning}
      className={cn(
        "min-h-28 w-full resize-none rounded-2xl border border-white/12 bg-white/[0.045] px-4 py-3 text-[15px] leading-relaxed text-[#fff9f3] outline-none transition placeholder:text-[#9e858c] focus:border-[#d99ab0]/70 focus:bg-white/[0.07] focus:ring-3 focus:ring-[#bd4f6c]/12 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
