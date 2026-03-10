import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: 
          "bg-white/20 dark:bg-white/10 text-foreground backdrop-blur-xl backdrop-saturate-[1.8] " +
          "border border-white/30 dark:border-white/15 " +
          "shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.4)] " +
          "hover:bg-white/30 dark:hover:bg-white/15 hover:shadow-[0_6px_20px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.5)] hover:scale-[1.02]",
        destructive:
          "bg-red-500/20 dark:bg-red-500/15 text-red-600 dark:text-red-400 backdrop-blur-xl backdrop-saturate-[1.8] " +
          "border border-red-400/30 dark:border-red-400/15 " +
          "shadow-[0_4px_16px_rgba(239,68,68,0.2),inset_0_1px_0_rgba(255,255,255,0.3)] " +
          "hover:bg-red-500/30 dark:hover:bg-red-500/20 hover:shadow-[0_6px_20px_rgba(239,68,68,0.25),inset_0_1px_0_rgba(255,255,255,0.4)] hover:scale-[1.02]",
        outline:
          "bg-white/10 dark:bg-black/10 text-foreground backdrop-blur-lg backdrop-saturate-[1.5] " +
          "border border-white/25 dark:border-white/10 " +
          "shadow-[0_2px_8px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.3)] " +
          "hover:bg-white/20 dark:hover:bg-white/5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.4)] hover:scale-[1.02]",
        secondary:
          "bg-black/5 dark:bg-white/5 text-foreground backdrop-blur-lg backdrop-saturate-[1.5] " +
          "border border-black/10 dark:border-white/10 " +
          "shadow-[0_2px_8px_rgba(0,0,0,0.06)] " +
          "hover:bg-black/10 dark:hover:bg-white/10 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:scale-[1.02]",
        ghost: 
          "bg-transparent text-foreground " +
          "hover:bg-white/10 dark:hover:bg-white/5 hover:backdrop-blur-sm hover:scale-[1.02]",
        link: "text-primary underline-offset-4 hover:underline",
        glass:
          "bg-white/15 dark:bg-black/20 text-foreground backdrop-blur-2xl backdrop-saturate-[1.8] " +
          "border border-white/25 dark:border-white/8 " +
          "shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_1px_1px_0_rgba(255,255,255,0.6),inset_0_0_8px_rgba(255,255,255,0.15)] " +
          "hover:bg-white/20 dark:hover:bg-black/25 hover:shadow-[0_12px_40px_rgba(0,0,0,0.16),inset_1px_1px_0_rgba(255,255,255,0.7),inset_0_0_12px_rgba(255,255,255,0.2)] hover:scale-[1.02]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
