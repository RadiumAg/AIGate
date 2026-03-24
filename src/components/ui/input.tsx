import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          "flex h-10 w-full rounded-2xl px-4 py-2 text-sm ring-offset-background",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground/60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Liquid Glass effect
          "border border-white/30 bg-white/20 backdrop-blur-xl backdrop-saturate-[1.7] dark:border-white/10 dark:bg-black/20",
          "shadow-[0_8px_24px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.45)]",
          // Focus state
          "focus:border-white/35 focus:bg-white/25 dark:focus:bg-black/25",
          "focus:shadow-[0_12px_30px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.5)]",
          // Hover state
          "hover:bg-white/25 dark:hover:bg-black/25",
          "transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
