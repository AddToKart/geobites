import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-2xl border border-[color:var(--color-border)] bg-white/85 px-4 py-2 text-sm text-[color:var(--color-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-all placeholder:text-[color:var(--color-text-light)] focus:border-[color:var(--color-border-strong)] focus:bg-white disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[color:var(--color-surface-2)] disabled:opacity-60 aria-invalid:border-[color:var(--color-danger)] file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input }
