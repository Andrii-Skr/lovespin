import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold tracking-[0.01em] transition-[transform,background-color,color,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5c78c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c0c12] disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-[#f6e9dd] text-[#32151e] hover:bg-white",
        accent: "bg-[#bd4f6c] text-white shadow-[0_14px_44px_rgba(189,79,108,.28)] hover:bg-[#cd5c78]",
        outline: "border border-white/18 bg-white/[0.04] text-[#f6e9dd] hover:bg-white/[0.09]",
        ghost: "text-[#d9c7bd] hover:bg-white/[0.06] hover:text-white",
      },
      size: {
        default: "min-h-12 px-6",
        lg: "min-h-14 px-8 text-base",
        icon: "size-12 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
