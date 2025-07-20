
'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { MonthlySalesData } from '@/lib/services/dashboardService';
import { CardDescription } from '@/components/ui/card';

interface AdminSalesChartProps {
  data: MonthlySalesData[];
}

const chartConfig = {
  sales: {
    label: 'Sales (৳)',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export default function AdminSalesChart({ data }: AdminSalesChartProps) {
  if (!data || data.length === 0) {
    return <CardDescription>No sales data available for the selected period.</CardDescription>;
  }

  const yAxisFormatter = (value: number) => {
    if (value >= 10000000) return `৳${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `৳${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `৳${(value / 1000).toFixed(1)}K`;
    return `৳${value}`;
  };
  
  const tooltipFormatter = (value: number) => `৳${value.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;


  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 10,
          left: 10,
          bottom: 5,
        }}
        barCategoryGap="20%"
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
        />
        <YAxis
          tickFormatter={yAxisFormatter}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
          width={70}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelClassName="font-semibold"
              formatter={(value, name, item) => {
                return (
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">{item.payload.name}</span>
                    <span className="font-bold text-foreground">{tooltipFormatter(value as number)}</span>
                  </div>
                );
              }}
              itemStyle={{padding:0, margin:0}}
              indicator="dot"
            />
          }
        />
        <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
