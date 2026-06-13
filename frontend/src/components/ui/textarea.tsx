import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[80px] w-full rounded-2xl border border-border bg-surface-2/60 px-4 py-3 text-sm text-text shadow-sm transition-all placeholder:text-text-soft/50 focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
