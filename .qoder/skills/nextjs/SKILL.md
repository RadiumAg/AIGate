---
name: nextjs
description: Develop Next.js 16+ applications with React 19, TypeScript, Tailwind CSS v4, and tRPC. Use when working with Next.js pages, API routes, server components, or when the user mentions Next.js development.
---

# Next.js Development

## Project Stack

- **Next.js**: 16.1.6 (App Router)
- **React**: 19.2.3
- **TypeScript**: 5.x
- **Tailwind CSS**: v4
- **tRPC**: 10.45.2 with React Query
- **Package Manager**: pnpm 9.0.0

## Key Configuration

### next.config.ts

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
};

export default nextConfig;
```

### Path Aliases

- `@/*` maps to `./src/*`

## Development Commands

```bash
# Development server
pnpm dev

# Build
pnpm build

# Start production server
pnpm start

# Linting
pnpm lint

# Formatting
pnpm format
pnpm format:check
```

## App Router Structure

```
src/app/
├── (dashboard)/          # Route group
│   ├── components/       # Route-specific components
│   ├── debug/
│   ├── keys/
│   ├── quotas/
│   ├── users/
│   ├── layout.tsx
│   └── page.tsx
├── api/                  # API routes
├── layout.tsx           # Root layout
└── globals.css          # Global styles
```

## Component Patterns

### Server Component (Default)

```typescript
// page.tsx or layout.tsx
export default async function Page() {
  const data = await fetchData();
  return <div>{/* render */}</div>;
}
```

### Client Component

```typescript
'use client';

import { useState } from 'react';

export function ClientComponent() {
  const [state, setState] = useState();
  return <div>{/* render */}</div>;
}
```

### tRPC Integration

```typescript
'use client';

import { trpc } from '@/utils/api';

export function Component() {
  const { data } = trpc.dashboard.getStats.useQuery();
  const mutation = trpc.apiKey.create.useMutation();

  return <div>{/* render */}</div>;
}
```

## Styling with Tailwind CSS v4

```typescript
// Basic usage
<div className="flex items-center justify-center p-4">

// Conditional classes
<div className={cn('base-classes', condition && 'conditional-class')}>

// Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

Use `cn()` utility from `@/lib/utils` for class merging.

## API Routes (tRPC)

Located in `src/server/api/routers/`:

```typescript
// src/server/api/routers/example.ts
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const exampleRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.table.findMany();
  }),

  create: publicProcedure.input(z.object({ name: z.string() })).mutation(async ({ ctx, input }) => {
    return await ctx.db.insert(table).values(input);
  }),
});
```

## Database (Drizzle ORM)

```bash
# Generate migrations
pnpm db:generate

# Push to database
pnpm db:push

# Run migrations
pnpm db:migrate

# Seed data
pnpm db:seed
```

## Best Practices

1. **Use Server Components by default** - Only add 'use client' when needed
2. **Leverage tRPC for type-safe APIs** - All API calls go through tRPC routers
3. **Keep components small and focused** - Follow single responsibility principle
4. **Use path aliases** - Import with `@/` prefix
5. **Format on save** - Project uses Prettier for consistent formatting
