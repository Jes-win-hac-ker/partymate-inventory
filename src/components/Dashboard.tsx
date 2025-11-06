import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Package, TrendingDown, Plus, RefreshCw, DollarSign, Eye } from "lucide-react";

interface Part {
  id: string;
  part_id: string;
  name: string;
  quantity: number;
  price: number;
  image_url?: string;
  created_at: string;
  user_id: string;
}

interface DashboardStats {
  totalParts: number;
  lowStockCount: number;
  recentParts: Part[];
}

export function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalParts: 0,
    lowStockCount: 0,
    recentParts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: parts, error } = await supabase
        .from("spare_parts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const lowStock = parts?.filter((p: Part) => p.quantity < 5) || [];
      const recent = parts?.slice(0, 5) || [];

      setStats({
        totalParts: parts?.length || 0,
        lowStockCount: lowStock.length,
        recentParts: recent,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Parts",
      value: stats.totalParts,
      icon: Package,
      description: "Parts in inventory",
    },
    {
      title: "Low Stock Alerts",
      value: stats.lowStockCount,
      icon: TrendingDown,
      description: "Parts with quantity < 5",
      className: stats.lowStockCount > 0 ? "border-warning" : "",
    },
  ];

  const quickActions = [
    { label: "Add New Part", icon: Plus, path: "/add-part", variant: "default" as const },
    { label: "Update Stock", icon: RefreshCw, path: "/update-stock", variant: "secondary" as const },
    { label: "Update Price", icon: DollarSign, path: "/update-price", variant: "secondary" as const },
    { label: "View Inventory", icon: Eye, path: "/inventory", variant: "outline" as const },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your auto parts inventory</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className={`transition-all hover:shadow-lg ${stat.className || ""}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.path}
                variant={action.variant}
                className="h-24 flex flex-col gap-2 transition-all hover:scale-105"
                onClick={() => navigate(action.path)}
              >
                <Icon className="h-6 w-6" />
                <span>{action.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {stats.recentParts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Added Parts</CardTitle>
            <CardDescription>Your latest inventory additions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentParts.map((part) => (
                <div key={part.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  {part.image_url && (
                    <img
                      src={part.image_url}
                      alt={part.name}
                      className="h-12 w-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{part.name}</div>
                    <div className="text-sm text-muted-foreground">ID: {part.part_id}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${part.price}</div>
                    <div className={`text-sm ${part.quantity < 5 ? "text-warning" : "text-muted-foreground"}`}>
                      Qty: {part.quantity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
