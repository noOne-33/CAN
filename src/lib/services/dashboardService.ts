
import { connectToDatabase } from '@/lib/mongodb';
import type { OrderDoc, DbUser } from '@/types'; // Assuming OrderDoc and DbUser are your database types

export interface MonthlySalesData {
  name: string; // For XAxis dataKey, e.g., "Jan '24"
  sales: number; // For Bar dataKey
}

export interface DashboardMetrics {
  totalSales: number;
  completedOrdersCount: number;
  activeOrdersCount: number;
  totalUsersCount: number;
  ordersThisMonthCount: number;
  salesThisMonth: number;
  salesLastMonth: number;
  salesGrowthPercentage: number;
  monthlySalesChartData: MonthlySalesData[];
}

export async function getDashboardAnalytics(): Promise<DashboardMetrics> {
  console.log('[dashboardService] getDashboardAnalytics called');
  try {
    const { db } = await connectToDatabase();
    const ordersCollection = db.collection<OrderDoc>('orders');
    const usersCollection = db.collection<DbUser>('users');

    // --- Sales and Order Counts ---
    const salesPipeline = [
      { $match: { orderStatus: 'Delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ];
    const salesResult = await ordersCollection.aggregate(salesPipeline).toArray();
    const totalSales = salesResult.length > 0 && salesResult[0].total ? salesResult[0].total : 0;

    const completedOrdersCount = await ordersCollection.countDocuments({ orderStatus: 'Delivered' });
    const activeOrdersCount = await ordersCollection.countDocuments({ orderStatus: { $in: ['Pending', 'Processing'] } });

    // --- User Counts ---
    const totalUsersCount = await usersCollection.countDocuments();

    // --- Monthly Data for current and last month sales ---
    const today = new Date();
    const firstDayCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const firstDayNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const ordersThisMonthCount = await ordersCollection.countDocuments({
      createdAt: { $gte: firstDayCurrentMonth, $lt: firstDayNextMonth }
    });

    const salesThisMonthPipeline = [
      { $match: { orderStatus: 'Delivered', createdAt: { $gte: firstDayCurrentMonth, $lt: firstDayNextMonth } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ];
    const salesThisMonthResult = await ordersCollection.aggregate(salesThisMonthPipeline).toArray();
    const salesThisMonth = salesThisMonthResult.length > 0 && salesThisMonthResult[0].total ? salesThisMonthResult[0].total : 0;
    
    const salesLastMonthPipeline = [
      { $match: { orderStatus: 'Delivered', createdAt: { $gte: firstDayLastMonth, $lt: firstDayCurrentMonth } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ];
    const salesLastMonthResult = await ordersCollection.aggregate(salesLastMonthPipeline).toArray();
    const salesLastMonth = salesLastMonthResult.length > 0 && salesLastMonthResult[0].total ? salesLastMonthResult[0].total : 0;

    let salesGrowthPercentage = 0;
    if (salesLastMonth > 0) {
      salesGrowthPercentage = ((salesThisMonth - salesLastMonth) / salesLastMonth) * 100;
    } else if (salesThisMonth > 0) {
      salesGrowthPercentage = 100; // Infinite growth if last month was 0 and this month is positive
    }

    // --- Monthly Sales Chart Data (Last 6 Months) ---
    const N_MONTHS_FOR_CHART = 6;
    const chartStartDate = new Date(today.getFullYear(), today.getMonth() - (N_MONTHS_FOR_CHART - 1), 1);

    const monthlySalesAggPipeline = [
      {
        $match: {
          orderStatus: 'Delivered',
          createdAt: { $gte: chartStartDate, $lt: firstDayNextMonth } // from start of 6-month window to end of current month
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalSales: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ];
    const aggregatedMonthlySales = await ordersCollection.aggregate(monthlySalesAggPipeline).toArray();
    
    const monthMap = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlySalesChartData: MonthlySalesData[] = [];
    for (let i = 0; i < N_MONTHS_FOR_CHART; i++) {
      const targetMonthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = targetMonthDate.getFullYear();
      const monthIndex = targetMonthDate.getMonth(); // 0-11

      const monthName = `${monthMap[monthIndex]} '${String(year).slice(-2)}`;
      
      const foundSale = aggregatedMonthlySales.find(
        (sale: any) => sale._id.year === year && sale._id.month === (monthIndex + 1) // MongoDB month is 1-12
      );
      
      monthlySalesChartData.push({
        name: monthName,
        sales: foundSale ? foundSale.totalSales : 0
      });
    }
    monthlySalesChartData.reverse(); // To have the oldest month first

    console.log('[dashboardService] Metrics calculated, including chart data.');

    return {
      totalSales,
      completedOrdersCount,
      activeOrdersCount,
      totalUsersCount,
      ordersThisMonthCount,
      salesThisMonth,
      salesLastMonth,
      salesGrowthPercentage,
      monthlySalesChartData,
    };

  } catch (error: any) {
    console.error('[dashboardService] Error in getDashboardAnalytics:', error.message);
    // Return default/zero values in case of an error to prevent page crash
    return {
      totalSales: 0,
      completedOrdersCount: 0,
      activeOrdersCount: 0,
      totalUsersCount: 0,
      ordersThisMonthCount: 0,
      salesThisMonth: 0,
      salesLastMonth: 0,
      salesGrowthPercentage: 0,
      monthlySalesChartData: Array(6).fill(null).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5-i));
        const monthMap = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return { name: `${monthMap[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`, sales: 0 };
      }),
    };
  }
}
