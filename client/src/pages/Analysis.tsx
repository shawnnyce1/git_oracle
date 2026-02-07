import { usePredictions } from "@/hooks/use-predictions";
import { Navbar } from "@/components/layout/Navbar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";

export default function Analysis() {
  const { data: predictions, isLoading } = usePredictions();

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
          <h1 className="text-3xl font-bold font-display text-white mb-2">Technical Analysis</h1>
          <p className="text-muted-foreground">AI-generated trading signals and market indicators.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {predictions?.slice().reverse().map((pred, i) => (
            <motion.div
              key={pred.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-6 hover:border-primary/30 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-mono text-muted-foreground">
                  {format(parseISO(pred.date), "MMMM d, yyyy")}
                </span>
                <StatusBadge status={pred.signal} />
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Signal Logic</label>
                  <p className="text-white text-sm mt-1">{pred.reason}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary"
                      style={{ width: `${parseFloat(pred.confidence || "0") * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-primary font-bold">
                    {Math.round(parseFloat(pred.confidence || "0") * 100)}%
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
