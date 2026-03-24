import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-20 w-full rounded-2xl px-4 py-3 text-base ring-offset-background",
        "placeholder:text-muted-foreground/60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "md:text-sm",
        "border border-white/30 bg-white/20 backdrop-blur-xl backdrop-saturate-[1.7] dark:border-white/10 dark:bg-black/20",
        "shadow-[0_8px_24px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.45)]",
        "focus:border-white/35 focus:bg-white/25 dark:focus:bg-black/25",
        "focus:shadow-[0_12px_30px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.5)]",
        "hover:bg-white/25 dark:hover:bg-black/25",
        "transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
