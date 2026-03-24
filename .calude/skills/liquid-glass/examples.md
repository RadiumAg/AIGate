# Liquid Glass Component Examples

Complete React component examples using the project's conventions (CVA, cn(), forwardRef, Tailwind CSS v4).

## SVG Filter Provider

Place once in your root layout or page to enable refraction distortion:

```tsx
// components/ui/glass-filter.tsx
export function GlassFilter() {
  return (
    <svg className="absolute h-0 w-0" aria-hidden="true">
      <defs>
        <filter id="glass-distortion">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.015"
            numOctaves="3"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="5"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  )
}
```

## Glass Card

```tsx
// components/ui/glass-card.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const glassCardVariants = cva(
  [
    "relative overflow-hidden rounded-2xl",
    "backdrop-blur-xl backdrop-saturate-[1.8]",
    "border",
    "shadow-[0_8px_32px_rgba(0,0,0,0.12)]",
    "transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-white/15 dark:bg-black/20",
          "border-white/25 dark:border-white/8",
          "[box-shadow:inset_1px_1px_0_rgba(255,255,255,0.6),inset_0_0_8px_rgba(255,255,255,0.15),0_8px_32px_rgba(0,0,0,0.12)]",
          "dark:[box-shadow:inset_1px_1px_0_rgba(255,255,255,0.15),inset_0_0_8px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.25)]",
        ].join(" "),
        thin: [
          "bg-white/8 dark:bg-black/12",
          "border-white/15 dark:border-white/5",
          "[box-shadow:inset_1px_1px_0_rgba(255,255,255,0.3),0_4px_16px_rgba(0,0,0,0.08)]",
          "dark:[box-shadow:inset_1px_1px_0_rgba(255,255,255,0.08),0_4px_16px_rgba(0,0,0,0.2)]",
          "backdrop-blur-lg",
        ].join(" "),
        thick: [
          "bg-white/25 dark:bg-black/30",
          "border-white/30 dark:border-white/10",
          "[box-shadow:inset_1px_1px_0_rgba(255,255,255,0.75),inset_0_0_16px_rgba(255,255,255,0.2),0_12px_40px_rgba(0,0,0,0.16)]",
          "dark:[box-shadow:inset_1px_1px_0_rgba(255,255,255,0.2),inset_0_0_16px_rgba(255,255,255,0.08),0_12px_40px_rgba(0,0,0,0.3)]",
          "backdrop-blur-2xl",
        ].join(" "),
      },
      interactive: {
        true: "hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(0,0,0,0.16)] active:scale-[0.98] motion-safe:transition-transform cursor-pointer",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      interactive: false,
    },
  }
)

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant, interactive, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(glassCardVariants({ variant, interactive, className }))}
        {...props}
      >
        <div className="relative z-10 p-6">{children}</div>
      </div>
    )
  }
)
GlassCard.displayName = "GlassCard"

export { GlassCard, glassCardVariants }
```

Usage:

```tsx
<GlassCard>
  <h3>Standard Glass Card</h3>
  <p>Content here</p>
</GlassCard>

<GlassCard variant="thick" interactive>
  <h3>Clickable Thick Glass</h3>
</GlassCard>
```

## Glass Button

```tsx
// components/ui/glass-button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const glassButtonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-xl font-medium",
    "backdrop-blur-xl backdrop-saturate-[1.8]",
    "border",
    "transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
    "motion-safe:hover:scale-[1.03] motion-safe:active:scale-[0.97]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-white/20 dark:bg-white/10",
          "border-white/30 dark:border-white/10",
          "text-gray-900 dark:text-white",
          "[box-shadow:inset_1px_1px_0_rgba(255,255,255,0.6),0_4px_16px_rgba(0,0,0,0.1)]",
          "dark:[box-shadow:inset_1px_1px_0_rgba(255,255,255,0.15),0_4px_16px_rgba(0,0,0,0.2)]",
          "hover:bg-white/30 dark:hover:bg-white/15",
          "hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)]",
        ].join(" "),
        primary: [
          "bg-blue-500/30 dark:bg-blue-400/20",
          "border-blue-300/40 dark:border-blue-400/20",
          "text-blue-900 dark:text-blue-100",
          "[box-shadow:inset_1px_1px_0_rgba(255,255,255,0.5),0_4px_16px_rgba(59,130,246,0.2)]",
          "dark:[box-shadow:inset_1px_1px_0_rgba(255,255,255,0.1),0_4px_16px_rgba(59,130,246,0.15)]",
          "hover:bg-blue-500/40 dark:hover:bg-blue-400/30",
        ].join(" "),
        destructive: [
          "bg-red-500/25 dark:bg-red-400/15",
          "border-red-300/35 dark:border-red-400/15",
          "text-red-900 dark:text-red-100",
          "[box-shadow:inset_1px_1px_0_rgba(255,255,255,0.4),0_4px_16px_rgba(239,68,68,0.15)]",
          "dark:[box-shadow:inset_1px_1px_0_rgba(255,255,255,0.08),0_4px_16px_rgba(239,68,68,0.12)]",
          "hover:bg-red-500/35 dark:hover:bg-red-400/25",
        ].join(" "),
      },
      size: {
        sm: "h-9 px-4 text-sm",
        default: "h-10 px-6 text-sm",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  asChild?: boolean
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(glassButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
GlassButton.displayName = "GlassButton"

export { GlassButton, glassButtonVariants }
```

Usage:

```tsx
<GlassButton>Default Glass</GlassButton>
<GlassButton variant="primary" size="lg">Primary Action</GlassButton>
<GlassButton variant="destructive">Delete</GlassButton>
```

## Glass Navigation Bar

```tsx
// components/ui/glass-navbar.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface GlassNavbarProps extends React.HTMLAttributes<HTMLElement> {
  sticky?: boolean
}

const GlassNavbar = React.forwardRef<HTMLElement, GlassNavbarProps>(
  ({ className, sticky = true, children, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        className={cn(
          "w-full backdrop-blur-2xl backdrop-saturate-[1.8]",
          "bg-white/20 dark:bg-black/25",
          "border-b border-white/20 dark:border-white/8",
          "[box-shadow:inset_0_-1px_0_rgba(255,255,255,0.3),0_1px_12px_rgba(0,0,0,0.08)]",
          "dark:[box-shadow:inset_0_-1px_0_rgba(255,255,255,0.08),0_1px_12px_rgba(0,0,0,0.2)]",
          sticky && "sticky top-0 z-50",
          className
        )}
        {...props}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
          {children}
        </div>
      </nav>
    )
  }
)
GlassNavbar.displayName = "GlassNavbar"

export { GlassNavbar }
```

## Glass Modal / Dialog Overlay

```tsx
// Usage with existing shadcn Dialog
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Override DialogContent styles with glass effect
<Dialog>
  <DialogContent className={cn(
    "bg-white/20 dark:bg-black/25",
    "backdrop-blur-2xl backdrop-saturate-[1.8]",
    "border border-white/25 dark:border-white/8",
    "rounded-2xl",
    "[box-shadow:inset_1px_1px_0_rgba(255,255,255,0.6),inset_0_0_12px_rgba(255,255,255,0.1),0_24px_80px_rgba(0,0,0,0.2)]",
    "dark:[box-shadow:inset_1px_1px_0_rgba(255,255,255,0.15),inset_0_0_12px_rgba(255,255,255,0.05),0_24px_80px_rgba(0,0,0,0.4)]",
  )}>
    <DialogHeader>
      <DialogTitle>Glass Modal</DialogTitle>
    </DialogHeader>
    {/* content */}
  </DialogContent>
</Dialog>
```

## Glass Input

```tsx
// components/ui/glass-input.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface GlassInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-xl px-4 py-2 text-sm",
          "bg-white/10 dark:bg-black/15",
          "backdrop-blur-lg backdrop-saturate-150",
          "border border-white/20 dark:border-white/8",
          "[box-shadow:inset_1px_1px_0_rgba(255,255,255,0.3)]",
          "dark:[box-shadow:inset_1px_1px_0_rgba(255,255,255,0.08)]",
          "placeholder:text-gray-500/70 dark:placeholder:text-gray-400/50",
          "focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40",
          "dark:focus:ring-white/15 dark:focus:border-white/15",
          "transition-all duration-200",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    )
  }
)
GlassInput.displayName = "GlassInput"

export { GlassInput }
```

## Utility: Glass Class Helper

If you need to apply glass styling to arbitrary elements:

```tsx
// lib/glass.ts
export const glass = {
  base: "backdrop-blur-xl backdrop-saturate-[1.8] bg-white/15 dark:bg-black/20 border border-white/25 dark:border-white/8 rounded-2xl",
  highlight: "[box-shadow:inset_1px_1px_0_rgba(255,255,255,0.6),inset_0_0_8px_rgba(255,255,255,0.15),0_8px_32px_rgba(0,0,0,0.12)]",
  highlightDark: "dark:[box-shadow:inset_1px_1px_0_rgba(255,255,255,0.15),inset_0_0_8px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.25)]",
  animation: "transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
  interactive: "hover:scale-[1.02] active:scale-[0.98] motion-safe:transition-transform cursor-pointer",
} as const
```

Usage:

```tsx
import { glass } from "@/lib/glass"
import { cn } from "@/lib/utils"

<div className={cn(glass.base, glass.highlight, glass.highlightDark, "p-6")}>
  Glass content
</div>
```
