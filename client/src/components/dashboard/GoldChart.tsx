import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { format, parseISO } from "date-fns";
import { GoldPrice, Prediction } from "@shared/schema";

interface GoldChartProps {
  data: GoldPrice[];
  predictions: Prediction[];
}

export function GoldChart({ data, predictions }: GoldChartProps) {
  const [range, setRange] = useState<"1M" | "3M" | "6M" | "1Y" | "ALL">("1Y");

  // Merge data and predictions for chart
  const chartData = useMemo(() => {
    // Sort data by date ascending
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Filter by range
    const now = new Date();
    let startDate = new Date();
    
    switch(range) {
      case "1M": startDate.setMonth(now.getMonth() - 1); break;
      case "3M": startDate.setMonth(now.getMonth() - 3); break;
      case "6M": startDate.setMonth(now.getMonth() - 6); break;
      case "1Y": startDate.setFullYear(now.getFullYear() - 1); break;
      case "ALL": startDate = new Date(0); break;
    }

    const filtered = sortedData.filter(item => new Date(item.date) >= startDate);

    return filtered.map(item => {
      const pred = predictions.find(p => p.date === item.date);
      return {
        ...item,
        close: parseFloat(item.close),
        signal: pred?.signal
      };
    });
  }, [data, predictions, range]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="text-sm text-muted-foreground mb-2">
            {format(parseISO(label), "MMM d, yyyy")}
          </p>
          <p className="text-lg font-bold text-primary font-mono">
            ${payload[0].value.toFixed(2)}
          </p>
          {dataPoint.signal && (
            <div className={`mt-2 text-xs font-bold px-2 py-1 rounded w-fit ${
              dataPoint.signal === 'BUY' ? 'bg-green-500/20 text-green-500' :
              dataPoint.signal === 'SELL' ? 'bg-red-500/20 text-red-500' :
              'bg-yellow-500/20 text-yellow-500'
            }`}>
              {dataPoint.signal} Signal
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold font-display text-white">Price History & Signals</h3>
        <div className="flex bg-secondary/50 rounded-lg p-1 gap-1">
          {["1M", "3M", "6M", "1Y", "ALL"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r as any)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                range === r 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-white/5"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="date" 
              tickFormatter={(str) => format(parseISO(str), "MMM d")}
              stroke="rgba(255,255,255,0.2)"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
            />
            <YAxis 
              domain={['auto', 'auto']}
              tickFormatter={(num) => `$${num}`}
              stroke="rgba(255,255,255,0.2)"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="close" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorClose)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
