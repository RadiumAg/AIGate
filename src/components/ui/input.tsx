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
          "flex h-10 w-full rounded-xl px-3 py-2 text-sm ring-offset-background",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground/60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Liquid Glass effect
          "bg-white/15 dark:bg-black/20 backdrop-blur-lg backdrop-saturate-[1.5]",
          "border border-white/25 dark:border-white/10",
          "shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.3)]",
          // Focus state
          "focus:bg-white/20 dark:focus:bg-black/25",
          "focus:shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.4)]",
          // Hover state
          "hover:bg-white/20 dark:hover:bg-black/25",
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
