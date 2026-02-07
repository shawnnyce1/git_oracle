
import { z } from 'zod';
import { insertGoldPriceSchema, goldPrices, predictions, backtests } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  gold: {
    list: {
      method: 'GET' as const,
      path: '/api/gold' as const,
      responses: {
        200: z.array(z.custom<typeof goldPrices.$inferSelect>()),
      },
    },
    update: {
      method: 'POST' as const,
      path: '/api/gold/update' as const,
      responses: {
        200: z.object({
          message: z.string(),
          addedRecords: z.number(),
        }),
      },
    },
  },
  predictions: {
    list: {
      method: 'GET' as const,
      path: '/api/predictions' as const,
      responses: {
        200: z.array(z.custom<typeof predictions.$inferSelect>()),
      },
    },
    generate: {
      method: 'POST' as const,
      path: '/api/predictions/generate' as const,
      responses: {
        200: z.object({
          message: z.string(),
          count: z.number(),
        }),
      },
    },
  },
  backtest: {
    run: {
      method: 'POST' as const,
      path: '/api/backtest' as const,
      input: z.object({
        startDate: z.string(),
        endDate: z.string(),
        shortWindow: z.number().default(50),
        longWindow: z.number().default(200),
      }),
      responses: {
        200: z.custom<any>(), // BacktestResult
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/backtest' as const,
      responses: {
        200: z.array(z.custom<typeof backtests.$inferSelect>()),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
