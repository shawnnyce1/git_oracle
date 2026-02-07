
import { z } from 'zod';
import { insertGoldPriceSchema, goldPrices, predictions } from './schema';

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
