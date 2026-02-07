import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export function StatCard({ label, value, subValue, icon: Icon, trend, trendValue }: StatCardProps) {
  return (
    <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
        <Icon className="w-24 h-24 transform translate-x-4 -translate-y-4" />
      </div>
      
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      </div>
      
      <div className="space-y-1 relative z-10">
        <h3 className="text-2xl font-bold font-mono tracking-tight text-white">
          {value}
        </h3>
        {subValue && (
          <p className="text-sm text-muted-foreground">{subValue}</p>
        )}
      </div>

      {trend && trendValue && (
        <div className={`mt-4 text-xs font-semibold flex items-center gap-1 ${
          trend === 'up' ? 'text-green-500' : 
          trend === 'down' ? 'text-red-500' : 'text-yellow-500'
        }`}>
          <span>{trend === 'up' ? '▲' : trend === 'down' ? '▼' : '●'}</span>
          {trendValue}
        </div>
      )}
    </div>
  );
}
