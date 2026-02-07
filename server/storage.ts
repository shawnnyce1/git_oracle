
import { db } from "./db";
import {
  goldPrices,
  predictions,
  backtests,
  type InsertGoldPrice,
  type InsertPrediction,
  type InsertBacktest,
  type GoldPrice,
  type Prediction,
  type Backtest
} from "@shared/schema";
import { eq, desc, asc } from "drizzle-orm";

export interface IStorage {
  getGoldPrices(): Promise<GoldPrice[]>;
  getLatestGoldPriceDate(): Promise<string | undefined>;
  createGoldPrice(price: InsertGoldPrice): Promise<GoldPrice>;
  bulkCreateGoldPrices(prices: InsertGoldPrice[]): Promise<void>;
  
  getPredictions(): Promise<Prediction[]>;
  createPrediction(prediction: InsertPrediction): Promise<Prediction>;
  clearPredictions(): Promise<void>;

  getBacktests(): Promise<Backtest[]>;
  createBacktest(backtest: InsertBacktest): Promise<Backtest>;
}

export class DatabaseStorage implements IStorage {
  async getGoldPrices(): Promise<GoldPrice[]> {
    return await db.select().from(goldPrices).orderBy(asc(goldPrices.date));
  }

  async getLatestGoldPriceDate(): Promise<string | undefined> {
    const result = await db.select().from(goldPrices).orderBy(desc(goldPrices.date)).limit(1);
    return result.length > 0 ? result[0].date : undefined;
  }

  async createGoldPrice(price: InsertGoldPrice): Promise<GoldPrice> {
    const [created] = await db.insert(goldPrices).values(price).onConflictDoNothing().returning();
    return created;
  }

  async bulkCreateGoldPrices(prices: InsertGoldPrice[]): Promise<void> {
    if (prices.length === 0) return;
    await db.insert(goldPrices).values(prices).onConflictDoNothing();
  }

  async getPredictions(): Promise<Prediction[]> {
    return await db.select().from(predictions).orderBy(desc(predictions.date));
  }

  async createPrediction(prediction: InsertPrediction): Promise<Prediction> {
    const [created] = await db.insert(predictions).values(prediction).returning();
    return created;
  }

  async clearPredictions(): Promise<void> {
    await db.delete(predictions);
  }

  async getBacktests(): Promise<Backtest[]> {
    return await db.select().from(backtests).orderBy(desc(backtests.createdAt));
  }

  async createBacktest(backtest: InsertBacktest): Promise<Backtest> {
    const [created] = await db.insert(backtests).values(backtest).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
