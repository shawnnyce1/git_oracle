import { useGoldPrices, useUpdateGoldData } from "@/hooks/use-gold";
import { usePredictions, useGeneratePredictions } from "@/hooks/use-predictions";
import { GoldChart } from "@/components/dashboard/GoldChart";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Navbar } from "@/components/layout/Navbar";
import { Loader2, TrendingUp, DollarSign, Activity, Database, Zap } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: prices, isLoading: isLoadingPrices } = useGoldPrices();
  const { data: predictions, isLoading: isLoadingPreds } = usePredictions();
  const { mutate: updateData, isPending: isUpdating } = useUpdateGoldData();
  const { mutate: generatePreds, isPending: isGenerating } = useGeneratePredictions();
  const { toast } = useToast();

  const handleUpdate = () => {
    updateData(undefined, {
      onSuccess: (data) => {
        toast({
          title: "Data Updated",
          description: data.message,
        });
      },
      onError: () => {
        toast({
          title: "Update Failed",
          description: "Could not fetch latest gold data.",
          variant: "destructive",
        });
      }
    });
  };

  const handleGenerate = () => {
    generatePreds(undefined, {
      onSuccess: (data) => {
        toast({
          title: "Predictions Generated",
          description: data.message,
        });
      },
      onError: () => {
        toast({
          title: "Generation Failed",
          description: "Could not generate new predictions.",
          variant: "destructive",
        });
      }
    });
  };

  if (isLoadingPrices || isLoadingPreds) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-muted-foreground font-mono text-sm animate-pulse">Initializing Financial Core...</p>
        </div>
      </div>
    );
  }

  const latestPrice = prices && prices.length > 0 
    ? prices[prices.length - 1] 
    : null;

  const previousPrice = prices && prices.length > 1
    ? prices[prices.length - 2]
    : null;

  const latestPrediction = predictions && predictions.length > 0
    ? predictions[predictions.length - 1]
    : null;

  const priceChange = latestPrice && previousPrice
    ? parseFloat(latestPrice.close) - parseFloat(previousPrice.close)
    : 0;
  
  const percentChange = latestPrice && previousPrice
    ? (priceChange / parseFloat(previousPrice.close)) * 100
    : 0;

  return (
    <div className="min-h-screen bg-background grid-bg selection:bg-primary/20">
      <Navbar />

      <main className="container mx-auto px-6 py-8">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display text-white mb-2">Market Overview</h1>
            <p className="text-muted-foreground">Real-time gold market analysis and AI predictions.</p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleUpdate}
              disabled={isUpdating}
              className="border-white/10 hover:bg-white/5 hover:border-primary/50 text-white"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
              Sync Data
            </Button>
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
              Run AI Models
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StatCard
              label="Current Gold Price"
              value={latestPrice ? `$${parseFloat(latestPrice.close).toFixed(2)}` : "N/A"}
              subValue={latestPrice ? format(parseISO(latestPrice.date), "MMM d, yyyy") : ""}
              icon={DollarSign}
              trend={priceChange >= 0 ? "up" : "down"}
              trendValue={`${percentChange > 0 ? "+" : ""}${percentChange.toFixed(2)}%`}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <StatCard
              label="Latest Signal"
              value={latestPrediction ? latestPrediction.signal : "NEUTRAL"}
              subValue={latestPrediction ? `Confidence: ${Math.round(parseFloat(latestPrediction.confidence || "0") * 100)}%` : "No data"}
              icon={Activity}
              trend={
                latestPrediction?.signal === "BUY" ? "up" : 
                latestPrediction?.signal === "SELL" ? "down" : "neutral"
              }
              trendValue={latestPrediction ? "AI Prediction" : ""}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <StatCard
              label="Market Volume"
              value={latestPrice ? parseInt(latestPrice.volume).toLocaleString() : "0"}
              subValue="Contracts Traded"
              icon={TrendingUp}
            />
          </motion.div>
        </div>

        {/* Main Chart Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-6 h-[500px] mb-8"
        >
          <GoldChart data={prices || []} predictions={predictions || []} />
        </motion.div>

        {/* Recent Predictions Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-lg">Recent AI Signals</h3>
              <Button variant="ghost" className="text-primary text-xs">View All</Button>
            </div>
            
            <div className="space-y-4">
              {predictions?.slice(-5).reverse().map((pred) => (
                <div key={pred.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium font-mono text-white">
                        {format(parseISO(pred.date), "MMM d, yyyy")}
                      </span>
                      <span className="text-xs text-muted-foreground">{pred.reason}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground">
                      {Math.round(parseFloat(pred.confidence || "0") * 100)}% Conf.
                    </span>
                    <StatusBadge status={pred.signal} />
                  </div>
                </div>
              ))}
              {!predictions?.length && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No predictions generated yet.
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-lg">Market Data Feed</h3>
              <Button variant="ghost" className="text-primary text-xs">Full History</Button>
            </div>

            <div className="overflow-hidden rounded-xl border border-white/5">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/5 text-muted-foreground font-medium uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Close</th>
                    <th className="px-4 py-3 text-right">High</th>
                    <th className="px-4 py-3 text-right">Low</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {prices?.slice(-5).reverse().map((price) => (
                    <tr key={price.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {format(parseISO(price.date), "MMM d")}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-white">
                        ${parseFloat(price.close).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-green-500/80">
                        ${parseFloat(price.high).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-red-500/80">
                        ${parseFloat(price.low).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
