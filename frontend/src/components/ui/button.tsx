import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-2xl border border-transparent text-sm font-semibold whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:ring-0 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)] shadow-[0_12px_20px_rgba(235,106,45,0.18)] hover:bg-[color:var(--color-primary-dark)] hover:shadow-[0_16px_24px_rgba(235,106,45,0.22)]",
        secondary:
          "bg-[color:var(--color-secondary)] text-[color:var(--color-secondary-foreground)] shadow-[0_12px_22px_rgba(34,53,71,0.16)] hover:bg-[#172636]",
        ghost:
          "border-[color:var(--color-border)] bg-white/70 text-[color:var(--color-text)] hover:bg-[color:var(--color-surface-2)]",
        destructive:
          "bg-[color:var(--color-danger)] text-white shadow-[0_12px_22px_rgba(217,72,91,0.16)] hover:bg-[#c53b4d]",
        link: "h-auto rounded-none px-0 text-[color:var(--color-primary-dark)] underline-offset-4 hover:underline shadow-none",
      },
      size: {
        default:
          "h-11 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-8 gap-1 rounded-xl px-2.5 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-xl px-3 text-sm has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-4",
        lg: "h-12 gap-2 px-5 text-sm has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-11 rounded-2xl",
        "icon-xs":
          "size-8 rounded-xl [&_svg:not([class*='size-'])]:size-4",
        "icon-sm": "size-9 rounded-xl",
        "icon-lg": "size-12 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
