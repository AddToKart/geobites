import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-2xl border border-border bg-surface-2/60 px-4 py-2 text-sm text-text shadow-sm transition-all placeholder:text-text-soft/50 focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface-2/40 disabled:opacity-60 aria-invalid:border-danger file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input }
