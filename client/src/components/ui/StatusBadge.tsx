import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusColor = (s: string) => {
    switch (s?.toUpperCase()) {
      case "BUY":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "SELL":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "HOLD":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
  };

  return (
    <span
      className={cn(
        "px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border",
        getStatusColor(status),
        className
      )}
    >
      {status}
    </span>
  );
}
