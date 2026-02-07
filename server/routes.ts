
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

// Polygon API Configuration
const POLYGON_API_KEY = "r37aFrmgOfMZphPTMQi336fw_WLHLAUA"; // Provided by user
const TICKER = "C:XAUUSD";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // GET Gold Prices
  app.get(api.gold.list.path, async (req, res) => {
    const prices = await storage.getGoldPrices();
    res.json(prices);
  });

  // POST Update Data (from CSV seed or Polygon API)
  app.post(api.gold.update.path, async (req, res) => {
    try {
      let addedCount = 0;
      
      // 1. Check if we have data. If empty, seed from CSV first.
      const latestDate = await storage.getLatestGoldPriceDate();
      
      if (!latestDate) {
        // Seed from CSV
        const csvPath = path.resolve(process.cwd(), "attached_assets/gold_2004_to_now_GC_F_1770428055043.csv");
        if (fs.existsSync(csvPath)) {
          console.log("Seeding from CSV:", csvPath);
          const fileContent = fs.readFileSync(csvPath, "utf-8");
          // The CSV has a header block before actual data, need to skip lines or parse carefully
          // Looking at file content:
          // Price,Open,High,Low,Close,Volume
          // Ticker,GC=F,GC=F,GC=F,GC=F,GC=F
          // Date,,,,,
          // 2004-01-05,415.7,422.5,422.5,424.4,20
          
          // We can just look for lines starting with a date pattern YYYY-MM-DD
          const lines = fileContent.split('\n');
          const records = [];
          
          for (const line of lines) {
            const parts = line.split(',');
            if (parts.length >= 6) {
              const date = parts[0].trim();
              if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                 // Valid data line
                 records.push({
                   date: date,
                   open: parts[1],
                   high: parts[2],
                   low: parts[3],
                   close: parts[4],
                   volume: parts[5]
                 });
              }
            }
          }
          
          await storage.bulkCreateGoldPrices(records);
          addedCount += records.length;
        }
      }

      // 2. Fetch new data from Polygon if we have a latest date (or even if we just seeded)
      // If we just seeded, we fetch from the last seeded date.
      // If we didn't seed (and DB was empty and no CSV), start from 2004-01-01
      
      const effectiveLastDate = await storage.getLatestGoldPriceDate() || "2004-01-01";
      const today = new Date().toISOString().split('T')[0];
      
      if (effectiveLastDate < today) {
        console.log(`Fetching from Polygon: ${effectiveLastDate} to ${today}`);
        const url = `https://api.polygon.io/v2/aggs/ticker/${TICKER}/range/1/day/${effectiveLastDate}/${today}?adjusted=true&sort=asc&limit=50000&apiKey=${POLYGON_API_KEY}`;
        
        try {
          const apiRes = await fetch(url);
          const data = await apiRes.json();
          
          if (data.results && Array.isArray(data.results)) {
            const newRecords = data.results.map((r: any) => {
               // Polygon returns timestamp in ms
               const dateStr = new Date(r.t).toISOString().split('T')[0];
               return {
                 date: dateStr,
                 open: r.o.toString(),
                 high: r.h.toString(),
                 low: r.l.toString(),
                 close: r.c.toString(),
                 volume: r.v.toString()
               };
            });
            
            // Filter out records <= effectiveLastDate to avoid duplicates (though onConflict handles it, it saves DB ops)
            const freshRecords = newRecords.filter((r: any) => r.date > effectiveLastDate);
            
            if (freshRecords.length > 0) {
               await storage.bulkCreateGoldPrices(freshRecords);
               addedCount += freshRecords.length;
            }
          }
        } catch (err) {
          console.error("Failed to fetch from Polygon:", err);
          // Don't fail the request if seeding worked, just log error
        }
      }

      res.json({ message: "Data updated successfully", addedRecords: addedCount });
    } catch (error) {
      console.error("Update error:", error);
      res.status(500).json({ message: "Failed to update data" });
    }
  });

  // GET Predictions
  app.get(api.predictions.list.path, async (req, res) => {
    const preds = await storage.getPredictions();
    res.json(preds);
  });

  // POST Generate Predictions
  app.post(api.predictions.generate.path, async (req, res) => {
    try {
      const prices = await storage.getGoldPrices();
      if (prices.length < 50) {
         return res.json({ message: "Not enough data for predictions", count: 0 });
      }

      // Simple Strategy: SMA Crossover (SMA 50 vs SMA 200)
      // This is a basic example.
      const predictionsToSave = [];
      await storage.clearPredictions(); // Clear old predictions to regenerate fresh ones

      // Calculate SMAs
      const calculateSMA = (data: any[], period: number, index: number) => {
        if (index < period - 1) return null;
        let sum = 0;
        for (let i = 0; i < period; i++) {
          sum += parseFloat(data[index - i].close);
        }
        return sum / period;
      };

      let lastSignal = "HOLD";

      for (let i = 200; i < prices.length; i++) {
         const sma50 = calculateSMA(prices, 50, i);
         const sma200 = calculateSMA(prices, 200, i);
         
         if (sma50 && sma200) {
            let signal = "HOLD";
            // Golden Cross
            if (sma50 > sma200 && lastSignal !== "BUY") {
               signal = "BUY";
            } 
            // Death Cross
            else if (sma50 < sma200 && lastSignal !== "SELL") {
               signal = "SELL";
            }
            
            if (signal !== "HOLD") {
               predictionsToSave.push({
                 date: prices[i].date,
                 signal: signal,
                 confidence: "0.8", // Mock confidence
                 reason: `SMA 50 (${sma50.toFixed(2)}) crossed ${signal === 'BUY' ? 'above' : 'below'} SMA 200 (${sma200.toFixed(2)})`
               });
               lastSignal = signal;
            }
         }
      }
      
      // Also add a prediction for the LATEST day based on current trend
      const lastIdx = prices.length - 1;
      const currentPrice = parseFloat(prices[lastIdx].close);
      const sma50Last = calculateSMA(prices, 50, lastIdx);
      
      if (sma50Last) {
         const trend = currentPrice > sma50Last ? "BUY" : "SELL";
         // Add a "Today" prediction if not already covered by crossover
         const existing = predictionsToSave.find(p => p.date === prices[lastIdx].date);
         if (!existing) {
             predictionsToSave.push({
                 date: prices[lastIdx].date,
                 signal: trend,
                 confidence: "0.6",
                 reason: `Current price ${trend === 'BUY' ? 'above' : 'below'} SMA 50`
             });
         }
      }

      // Save to DB (reverse order to have latest first in loop, but we want to save all)
      // Bulk create
      for (const pred of predictionsToSave) {
        await storage.createPrediction(pred);
      }

      res.json({ message: "Predictions generated", count: predictionsToSave.length });
    } catch (error) {
       console.error("Prediction error:", error);
       res.status(500).json({ message: "Failed to generate predictions" });
    }
  });

  return httpServer;
}
