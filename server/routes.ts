
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import fs from "fs";
import path from "path";

// Polygon API Configuration
const POLYGON_API_KEY = "r37aFrmgOfMZphPTMQi336fw_WLHLAUA"; 
const TICKER = "C:XAUUSD";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get(api.gold.list.path, async (req, res) => {
    const prices = await storage.getGoldPrices();
    res.json(prices);
  });

  app.post(api.gold.update.path, async (req, res) => {
    try {
      let addedCount = 0;
      const latestDate = await storage.getLatestGoldPriceDate();
      
      if (!latestDate) {
        const csvPath = path.resolve(process.cwd(), "attached_assets/gold_2004_to_now_GC_F_1770428055043.csv");
        if (fs.existsSync(csvPath)) {
          const fileContent = fs.readFileSync(csvPath, "utf-8");
          const lines = fileContent.split('\n');
          const records = [];
          for (const line of lines) {
            const parts = line.split(',');
            if (parts.length >= 6) {
              const date = parts[0].trim();
              if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
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

      const effectiveLastDate = await storage.getLatestGoldPriceDate() || "2004-01-01";
      const today = new Date().toISOString().split('T')[0];
      
      if (effectiveLastDate < today) {
        const url = `https://api.polygon.io/v2/aggs/ticker/${TICKER}/range/1/day/${effectiveLastDate}/${today}?adjusted=true&sort=asc&limit=50000&apiKey=${POLYGON_API_KEY}`;
        try {
          const apiRes = await fetch(url);
          const data = await apiRes.json();
          if (data.results && Array.isArray(data.results)) {
            const newRecords = data.results.map((r: any) => ({
              date: new Date(r.t).toISOString().split('T')[0],
              open: r.o.toString(),
              high: r.h.toString(),
              low: r.l.toString(),
              close: r.c.toString(),
              volume: r.v.toString()
            }));
            const freshRecords = newRecords.filter((r: any) => r.date > effectiveLastDate);
            if (freshRecords.length > 0) {
               await storage.bulkCreateGoldPrices(freshRecords);
               addedCount += freshRecords.length;
            }
          }
        } catch (err) {
          console.error("Polygon fetch failed:", err);
        }
      }
      res.json({ message: "Data updated", addedRecords: addedCount });
    } catch (error) {
      res.status(500).json({ message: "Update failed" });
    }
  });

  app.get(api.predictions.list.path, async (req, res) => {
    const preds = await storage.getPredictions();
    res.json(preds);
  });

  app.post(api.predictions.generate.path, async (req, res) => {
    try {
      const prices = await storage.getGoldPrices();
      if (prices.length < 200) return res.json({ message: "Not enough data", count: 0 });
      
      await storage.clearPredictions();
      const predictionsToSave = [];
      let lastSignal = "HOLD";

      const calculateSMA = (data: any[], period: number, index: number) => {
        let sum = 0;
        for (let i = 0; i < period; i++) sum += parseFloat(data[index - i].close);
        return sum / period;
      };

      for (let i = 200; i < prices.length; i++) {
        const sma50 = calculateSMA(prices, 50, i);
        const sma200 = calculateSMA(prices, 200, i);
        let signal = "HOLD";
        if (sma50 > sma200 && lastSignal !== "BUY") signal = "BUY";
        else if (sma50 < sma200 && lastSignal !== "SELL") signal = "SELL";
        
        if (signal !== "HOLD") {
          predictionsToSave.push({
            date: prices[i].date,
            signal,
            confidence: "0.8",
            reason: `SMA Crossover at ${prices[i].close}`
          });
          lastSignal = signal;
        }
      }

      for (const p of predictionsToSave) await storage.createPrediction(p);
      res.json({ message: "Generated", count: predictionsToSave.length });
    } catch (error) {
      res.status(500).json({ message: "Failed" });
    }
  });

  app.post(api.backtest.run.path, async (req, res) => {
    const { startDate, endDate, shortWindow, longWindow } = req.body;
    const prices = await storage.getGoldPrices();
    const filtered = prices.filter(p => p.date >= startDate && p.date <= endDate);
    
    if (filtered.length < longWindow) return res.status(400).json({ message: "Range too small" });

    let balance = 10000;
    let position = 0;
    let trades = [];
    let lastSignal = "HOLD";

    const calculateSMA = (data: any[], period: number, index: number) => {
      let sum = 0;
      for (let i = 0; i < period; i++) sum += parseFloat(data[index - i].close);
      return sum / period;
    };

    const tradeHistory: any[] = [];

    for (let i = longWindow; i < filtered.length; i++) {
      const sWindow = calculateSMA(filtered, shortWindow, i);
      const lWindow = calculateSMA(filtered, longWindow, i);
      const price = parseFloat(filtered[i].close);

      if (sWindow > lWindow && lastSignal !== "BUY") {
        position = balance / price;
        tradeHistory.push({ entryDate: filtered[i].date, entryPrice: price, type: 'BUY' as const, exitDate: '', exitPrice: 0, profit: 0 });
        lastSignal = "BUY";
      } else if (sWindow < lWindow && lastSignal === "BUY") {
        const entry = tradeHistory[tradeHistory.length - 1];
        balance = position * price;
        entry.exitDate = filtered[i].date;
        entry.exitPrice = price;
        entry.profit = balance - 10000;
        lastSignal = "SELL";
      }
    }

    const result = {
      totalReturn: ((balance - 10000) / 10000) * 100,
      winRate: (tradeHistory.filter(t => t.profit > 0).length / tradeHistory.length) * 100 || 0,
      tradesCount: tradeHistory.length,
      trades: tradeHistory
    };

    await storage.createBacktest({
      name: `Backtest ${shortWindow}/${longWindow}`,
      startDate,
      endDate,
      totalReturn: result.totalReturn.toFixed(2),
      winRate: result.winRate.toFixed(2),
      tradesCount: result.tradesCount,
      config: JSON.stringify({ shortWindow, longWindow })
    });

    res.json(result);
  });

  app.get(api.backtest.list.path, async (req, res) => {
    res.json(await storage.getBacktests());
  });

  return httpServer;
}
