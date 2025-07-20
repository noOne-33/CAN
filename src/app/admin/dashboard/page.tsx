
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, ShoppingCart, Package, Users, TrendingUp, PackagePlus } from 'lucide-react';
import { getDashboardAnalytics, type DashboardMetrics, type MonthlySalesData } from '@/lib/services/dashboardService';
import { cn } from '@/lib/utils';
import type React from 'react';
import AdminSalesChart from './AdminSalesChart';

export const metadata = {
  title: 'Admin Dashboard - CAN',
  description: 'Overview of the CAN e-commerce platform sales, orders, and users.',
};

export const dynamic = 'force-dynamic'; // Ensure data is fetched on each request

// Define the TakaIcon component
const TakaIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
    {...props}
  >
    <text
      x="50%"
      y="50%"
      dominantBaseline="central"
      textAnchor="middle"
      fontSize="28" 
      fontFamily="system-ui, sans-serif"
      fontWeight= "9000"
    >
      ৳
    </text>
  </svg>
);

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: number; // For growth percentage
  trendDirection?: 'up' | 'down' | 'neutral';
  className?: string;
}

function MetricCard({ title, value, icon: Icon, description, trend, trendDirection, className }: MetricCardProps) {
  const trendColor = trendDirection === 'up' ? 'text-green-600' : trendDirection === 'down' ? 'text-red-600' : 'text-muted-foreground';
  return (
    <Card className={cn("shadow-md hover:shadow-lg transition-shadow", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">
          {typeof value === 'number' && (title.toLowerCase().includes('sales') || title.toLowerCase().includes('revenue')) ? `৳${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : value.toLocaleString()}
        </div>
        {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
        {trend !== undefined && (
          <p className={cn("text-xs pt-1", trendColor)}>
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}


export default async function AdminDashboardPage() {
  const metrics = await getDashboardAnalytics();

  const getTrendDirection = (growth: number): 'up' | 'down' | 'neutral' => {
    if (growth > 0) return 'up';
    if (growth < 0) return 'down';
    return 'neutral';
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-3xl font-headline">
            <LayoutDashboard size={30} className="mr-3 text-primary" />
            Admin Dashboard
          </CardTitle>
          <CardDescription className="text-md">Welcome to the CAN Admin Panel. Here's a quick overview of your store.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <MetricCard
          title="Total Sales"
          value={metrics.totalSales}
          icon={TakaIcon} 
          description="All-time gross sales from completed orders."
        />
        <MetricCard
          title="Sales This Month"
          value={metrics.salesThisMonth}
          icon={TrendingUp}
          description="Sales from completed orders this month."
          trend={metrics.salesGrowthPercentage}
          trendDirection={getTrendDirection(metrics.salesGrowthPercentage)}
        />
        <MetricCard
          title="Completed Orders"
          value={metrics.completedOrdersCount}
          icon={ShoppingCart}
          description="Total orders successfully delivered."
        />
        <MetricCard
          title="Active Orders"
          value={metrics.activeOrdersCount}
          icon={Package}
          description="Orders currently 'Pending' or 'Processing'."
        />
         <MetricCard
          title="Orders This Month"
          value={metrics.ordersThisMonthCount}
          icon={PackagePlus}
          description="New orders placed in the current month."
        />
        <MetricCard
          title="Total Users"
          value={metrics.totalUsersCount}
          icon={Users}
          description="Total registered users on the platform."
        />
      </div>
      
      <Card className="mt-6 shadow-md">
        <CardHeader>
          <CardTitle>Monthly Sales Analytics (Last 6 Months)</CardTitle>
          <CardDescription>Sales revenue from delivered orders over the past six months.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminSalesChart data={metrics.monthlySalesChartData} />
        </CardContent>
      </Card>
    </div>
  );
}
