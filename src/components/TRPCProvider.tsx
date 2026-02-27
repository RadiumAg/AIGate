'use client';

import { FC, ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import superjson from 'superjson';
import { AppRouter } from '../server/api/root';

interface TRPCProviderProps {
  children: ReactNode;
}

const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return ''; // browser should use relative url
  if (typeof process !== 'undefined' && process.env.VERCEL_URL)
    return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return `http://localhost:3000`; // dev SSR should use localhost
};

const TRPCProvider: FC<TRPCProviderProps> = (props) => {
  const { children } = props;

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      transformer: superjson,
      links: [
        loggerLink({
          enabled: (opts: { direction: string; result: unknown }) =>
            (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
};

export { TRPCProvider, trpc };
