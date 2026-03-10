---
name: liquid-glass
description: Generate Apple Liquid Glass style UI components and effects using CSS, Tailwind CSS and SVG filters. Use when the user mentions liquid glass, glassmorphism, frosted glass, glass card, glass button, glass panel, or Apple-style translucent UI effects.
---

# Apple Liquid Glass Effect

Generate Apple Liquid Glass (iOS 26 / macOS Tahoe) style UI components using CSS, Tailwind CSS v4, and SVG filters for React/Next.js projects.

## Core Visual Characteristics

Liquid Glass has four distinct visual layers, stacked bottom-to-top:

1. **Blur Layer** - `backdrop-filter: blur()` blurs the background content behind the glass
2. **Tint Layer** - Semi-transparent background color that tints the glass
3. **Specular Layer** - Inner highlights and edge glow simulating light refraction
4. **Content Layer** - The actual UI content sitting on top

Additional visual traits:

- Edges have subtle inner glow (inset `box-shadow` with white/translucent)
- Background colors bleed through with enhanced saturation (`saturate(150-180%)`)
- Subtle outer shadow for depth separation
- Rounded corners (`border-radius: 1rem` to `2rem`)
- Optional SVG `feDisplacementMap` filter for refraction distortion

## Implementation Strategy

### CSS Custom Properties

Always define theme variables for consistent reuse:

```css
:root {
  --glass-bg: rgba(255, 255, 255, 0.15);
  --glass-bg-dark: rgba(0, 0, 0, 0.2);
  --glass-highlight: rgba(255, 255, 255, 0.6);
  --glass-highlight-dark: rgba(255, 255, 255, 0.15);
  --glass-blur: 20px;
  --glass-saturate: 180%;
  --glass-border: rgba(255, 255, 255, 0.25);
  --glass-border-dark: rgba(255, 255, 255, 0.08);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  --glass-radius: 1.25rem;
}
```

### Tailwind CSS Approach

Use Tailwind utility classes as the primary method, with `@apply` or inline styles for complex effects:

```tsx
// Basic glass container
<div
  className="relative overflow-hidden rounded-2xl
  bg-white/15 dark:bg-black/20
  backdrop-blur-xl backdrop-saturate-[1.8]
  shadow-[0_8px_32px_rgba(0,0,0,0.12)]
  border border-white/25 dark:border-white/8
  [box-shadow:inset_1px_1px_0_rgba(255,255,255,0.6),inset_0_0_8px_rgba(255,255,255,0.15)]
"
>
  {children}
</div>
```

### Multi-Layer Structure (Advanced)

For higher-fidelity Liquid Glass requiring refraction distortion, use a multi-layer DOM approach:

```tsx
<div className="relative overflow-hidden rounded-2xl shadow-lg">
  {/* SVG filter for refraction (optional, placed once in page) */}
  <svg className="absolute w-0 h-0">
    <filter id="glass-distortion">
      <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" />
    </filter>
  </svg>

  {/* Layer 1: Blur */}
  <div
    className="absolute inset-0 backdrop-blur-xl backdrop-saturate-[1.8]
    [filter:url(#glass-distortion)]"
  />

  {/* Layer 2: Tint */}
  <div className="absolute inset-0 bg-white/15 dark:bg-black/20" />

  {/* Layer 3: Specular highlights */}
  <div
    className="absolute inset-0
    [box-shadow:inset_1px_1px_0_rgba(255,255,255,0.6),inset_-1px_-1px_0_rgba(255,255,255,0.1),inset_0_0_12px_rgba(255,255,255,0.1)]"
  />

  {/* Layer 4: Content */}
  <div className="relative z-10 p-6">{children}</div>
</div>
```

## Component Variants

When generating Liquid Glass components, support these variants:

| Variant   | Background   | Blur   | Highlight Intensity | Use Case                |
| --------- | ------------ | ------ | ------------------- | ----------------------- |
| `default` | `white/15`   | `20px` | Medium              | Cards, panels           |
| `thin`    | `white/8`    | `12px` | Low                 | Overlays, tooltips      |
| `thick`   | `white/25`   | `28px` | High                | Modals, navigation bars |
| `colored` | `{color}/15` | `20px` | Medium              | Accent elements         |

## Dark Mode

Always provide dark mode variants:

- Reduce background opacity: `white/15` -> `black/20`
- Reduce highlight intensity: `rgba(255,255,255,0.6)` -> `rgba(255,255,255,0.15)`
- Reduce border opacity: `white/25` -> `white/8`
- Keep blur and saturate values similar

## Animation Guidelines

Liquid Glass interactions should feel organic:

- **Hover**: Scale up slightly (`scale(1.02)`) with increased highlight
- **Press**: Scale down (`scale(0.98)`) with reduced highlight
- **Transition**: Use spring-like cubic-bezier: `cubic-bezier(0.34, 1.56, 0.64, 1)`
- **Duration**: 200-300ms for hover, 150ms for press

```tsx
className="transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]
  hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(0,0,0,0.16)]
  active:scale-[0.98]"
```

## Accessibility

- **Contrast**: If text contrast ratio < 4.5:1, add a darker tint layer or use `text-shadow`
- **Reduced Motion**: Wrap animations in `motion-safe:` Tailwind prefix
- **Fallback**: For browsers without `backdrop-filter` support, provide a solid semi-transparent background

```tsx
className="bg-white/80 [@supports(backdrop-filter:blur(1px))]:bg-white/15
  backdrop-blur-xl"
```

## Performance

- `backdrop-filter` triggers GPU compositing; avoid using on many overlapping elements
- Prefer single-layer approach for lists and repeated items
- Reserve multi-layer approach for hero elements and modals
- Avoid animating `backdrop-filter` or `filter` values directly

## Additional Resources

- For complete React component examples, see [examples.md](examples.md)
