
import { pgTable, text, serial, numeric, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const goldPrices = pgTable("gold_prices", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(), // YYYY-MM-DD
  open: numeric("open").notNull(),
  high: numeric("high").notNull(),
  low: numeric("low").notNull(),
  close: numeric("close").notNull(),
  volume: numeric("volume").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const predictions = pgTable("predictions", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // The date the prediction is for
  signal: text("signal").notNull(), // "BUY", "SELL", "HOLD"
  confidence: numeric("confidence"),
  reason: text("reason"), // e.g. "SMA Crossover"
  createdAt: timestamp("created_at").defaultNow(),
});

export const backtests = pgTable("backtests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  totalReturn: numeric("total_return").notNull(),
  winRate: numeric("win_rate").notNull(),
  tradesCount: integer("trades_count").notNull(),
  config: text("config"), // JSON string of strategy config
  createdAt: timestamp("created_at").defaultNow(),
});

// === SCHEMAS ===

export const insertGoldPriceSchema = createInsertSchema(goldPrices).omit({ id: true, createdAt: true });
export const insertPredictionSchema = createInsertSchema(predictions).omit({ id: true, createdAt: true });
export const insertBacktestSchema = createInsertSchema(backtests).omit({ id: true, createdAt: true });

// === TYPES ===

export type GoldPrice = typeof goldPrices.$inferSelect;
export type InsertGoldPrice = z.infer<typeof insertGoldPriceSchema>;

export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;

export type Backtest = typeof backtests.$inferSelect;
export type InsertBacktest = z.infer<typeof insertBacktestSchema>;

// === API TYPES ===

export interface GoldDataResponse {
  prices: GoldPrice[];
  predictions: Prediction[];
}

export interface UpdateDataResponse {
  message: string;
  addedRecords: number;
}

export interface BacktestResult {
  totalReturn: number;
  winRate: number;
  tradesCount: number;
  trades: {
    entryDate: string;
    exitDate: string;
    entryPrice: number;
    exitPrice: number;
    profit: number;
    type: 'BUY' | 'SELL';
  }[];
}
