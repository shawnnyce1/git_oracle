import { Link, useLocation } from "wouter";
import { Activity, BarChart2, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Activity },
    { href: "/analysis", label: "Analysis", icon: BarChart2 },
    { href: "/data", label: "Raw Data", icon: DollarSign },
  ];

  return (
    <nav className="border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FDB931] flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <DollarSign className="w-5 h-5 text-black font-bold" />
          </div>
          <span className="text-xl font-bold tracking-tight font-display text-gradient">
            GoldSight
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer",
                  location === item.href
                    ? "bg-white/10 text-primary shadow-inner"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
