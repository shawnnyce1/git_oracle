import { useGoldPrices } from "@/hooks/use-gold";
import { Navbar } from "@/components/layout/Navbar";
import { Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";

export default function DataView() {
  const { data: prices, isLoading } = useGoldPrices();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid-bg">
      <Navbar />
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display text-white mb-2">Raw Data Explorer</h1>
          <p className="text-muted-foreground">Historical gold price data records.</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 text-muted-foreground font-medium uppercase text-xs border-b border-white/5">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Open</th>
                  <th className="px-6 py-4 text-right">High</th>
                  <th className="px-6 py-4 text-right">Low</th>
                  <th className="px-6 py-4 text-right">Close</th>
                  <th className="px-6 py-4 text-right">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {prices?.slice().reverse().map((price) => (
                  <tr key={price.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-primary">
                      {format(parseISO(price.date), "yyyy-MM-dd")}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-muted-foreground">
                      {parseFloat(price.open).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-green-500/80">
                      {parseFloat(price.high).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-red-500/80">
                      {parseFloat(price.low).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-white">
                      {parseFloat(price.close).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-muted-foreground">
                      {parseInt(price.volume).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
