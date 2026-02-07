
import { db } from "./db";
import {
  goldPrices,
  predictions,
  type InsertGoldPrice,
  type InsertPrediction,
  type GoldPrice,
  type Prediction
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
}

export class DatabaseStorage implements IStorage {
  async getGoldPrices(): Promise<GoldPrice[]> {
    // Return sorted by date ascending for charts
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
    // Process in chunks to avoid query limits if necessary, but Drizzle handles batching well usually.
    // Using onConflictDoNothing to avoid duplicates
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
}

export const storage = new DatabaseStorage();
