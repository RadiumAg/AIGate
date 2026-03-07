import { createTRPCRouter } from './trpc';
import { aiRouter } from './routers/ai';
import { quotaRouter } from './routers/quota';
import { apiKeyRouter } from './routers/api-key';
import { dashboardRouter } from './routers/dashboard';
import { whitelistRouter } from './routers/whitelist';
import { settingsRouter } from './routers/settings';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  ai: aiRouter,
  quota: quotaRouter,
  apiKey: apiKeyRouter,
  dashboard: dashboardRouter,
  whitelist: whitelistRouter,
  settings: settingsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
