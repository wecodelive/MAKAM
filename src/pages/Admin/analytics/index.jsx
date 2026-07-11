import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, TrendingUp, Users, ShoppingCart } from "lucide-react";
import {
  adminGetSalesDashboard,
  adminGetMonthlyItemSalesReport,
  adminGetTopProducts,
} from "../../../services/adminFunctions";
import { notifyError } from "../../../utils/notify";

export default function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [dashboard, setDashboard] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [monthlyItemSales, setMonthlyItemSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const reportYear = new Date().getFullYear();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat("en-US").format(Number(value || 0));
  };

  const formatChange = (value) => {
    const numeric = Number(value || 0);
    const prefix = numeric > 0 ? "+" : "";
    return `${prefix}${numeric.toFixed(1)}%`;
  };

  const fetchAnalytics = async (period) => {
    try {
      setLoading(true);

      const [salesPayload, topProductsPayload, monthlyReportPayload] =
        await Promise.all([
          adminGetSalesDashboard({ period }),
          adminGetTopProducts(10, period),
          adminGetMonthlyItemSalesReport({ year: reportYear }),
        ]);

      if (!salesPayload.success) {
        throw new Error(
          salesPayload.message || "Failed to load dashboard metrics",
        );
      }

      if (!topProductsPayload.success) {
        throw new Error(
          topProductsPayload.message || "Failed to load top products",
        );
      }

      if (!monthlyReportPayload.success) {
        throw new Error(
          monthlyReportPayload.message || "Failed to load monthly item report",
        );
      }

      setDashboard(salesPayload);
      setTopProducts(topProductsPayload.topProducts || []);
      setMonthlyItemSales(monthlyReportPayload.rows || []);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      notifyError(error.message || "Unable to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(selectedPeriod);
  }, [selectedPeriod]);

  const metrics = useMemo(
    () => [
      {
        title: "Total Revenue",
        value: formatCurrency(dashboard?.metrics?.totalRevenue?.value),
        change: formatChange(dashboard?.metrics?.totalRevenue?.change),
        icon: TrendingUp,
        color: "text-green-600",
      },
      {
        title: "Total Orders",
        value: formatNumber(dashboard?.metrics?.totalOrders?.value),
        change: formatChange(dashboard?.metrics?.totalOrders?.change),
        icon: ShoppingCart,
        color: "text-blue-600",
      },
      {
        title: "New Customers",
        value: formatNumber(dashboard?.metrics?.newCustomers?.value),
        change: formatChange(dashboard?.metrics?.newCustomers?.change),
        icon: Users,
        color: "text-purple-600",
      },
      {
        title: "Avg Order Value",
        value: formatCurrency(dashboard?.metrics?.averageOrderValue?.value),
        change: formatChange(dashboard?.metrics?.averageOrderValue?.change),
        icon: BarChart3,
        color: "text-orange-600",
      },
    ],
    [dashboard],
  );

  const trendData = dashboard?.trend || [];
  const maxTrendValue = useMemo(() => {
    if (!trendData.length) return 0;
    return trendData.reduce(
      (max, point) => Math.max(max, Number(point.value || 0)),
      0,
    );
  }, [trendData]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#FBFBF8_0%,#FFFFFF_45%,#F7F5F0_100%)] px-4 py-6 lg:px-8 pb-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3">
          <div className="inline-flex w-fit items-center rounded-full border border-[#00000014] bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-[1px] text-[#0000008C] shadow-sm">
            Admin / Analytics
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-[28px] font-black leading-tight tracking-[2px] uppercase text-[#111111] lg:text-[36px]">
                Analytics & reports
              </h1>
              <p className="mt-2 max-w-xl text-[13px] leading-6 text-[#0000008C]">
                Track revenue, top-selling products, and monthly item sales in a
                cleaner dashboard view.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-[#00000012] bg-white px-4 py-3 shadow-sm">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[1px] text-[#0000008C]">
                  Reporting period
                </p>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="mt-1 bg-transparent text-[13px] font-semibold text-[#111111] outline-none"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="h-10 w-px bg-[#00000010]" />

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[1px] text-[#0000008C]">
                  Item report year
                </p>
                <p className="mt-1 text-[13px] font-semibold text-[#111111]">
                  {reportYear}
                </p>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="mb-4 rounded-2xl border border-[#00000012] bg-white p-4 text-[12px] text-[#0000008C] shadow-sm">
            Loading analytics...
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 mb-8">
          {metrics.map((metric) => {
            const IconComponent = metric.icon;
            return (
              <div
                key={metric.title}
                className="rounded-[28px] border border-[#00000012] bg-white p-6 shadow-[0_10px_40px_rgba(15,15,15,0.04)]"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#0000008C]">
                      {metric.title}
                    </h3>
                    <p className="mt-2 text-[30px] font-black leading-none text-[#111111]">
                      {metric.value}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#00000003] p-3">
                    <IconComponent className={`${metric.color}`} size={22} />
                  </div>
                </div>
                <p className="text-[12px] font-medium text-[#0000008C]">
                  {metric.change}
                </p>
              </div>
            );
          })}
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-[28px] border border-[#00000012] bg-white p-5 shadow-[0_10px_40px_rgba(15,15,15,0.04)] lg:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-[13px] font-semibold uppercase tracking-[1.5px] text-[#111111]">
                Top selling products
              </h2>
              <span className="rounded-full bg-[#00000008] px-2 py-1 text-[10px] font-medium uppercase tracking-[1px] text-[#0000008C]">
                Current {selectedPeriod}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[#00000012] text-[#0000008C]">
                    <th className="py-2 px-2 text-left font-medium uppercase">
                      Product
                    </th>
                    <th className="py-2 px-2 text-center font-medium uppercase">
                      Sales
                    </th>
                    <th className="py-2 px-2 text-right font-medium uppercase">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-6 text-center text-[#0000008C]"
                      >
                        No product sales data for this period.
                      </td>
                    </tr>
                  )}

                  {topProducts.map((product) => (
                    <tr
                      key={product.productId || product.name}
                      className="border-b border-[#00000008] hover:bg-[#00000003]"
                    >
                      <td className="py-3 px-2">{product.name}</td>
                      <td className="py-3 px-2 text-center font-medium">
                        {formatNumber(product.sales)}
                      </td>
                      <td className="py-3 px-2 text-right font-medium">
                        {formatCurrency(product.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-[28px] border border-[#00000012] bg-white p-5 shadow-[0_10px_40px_rgba(15,15,15,0.04)] lg:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-[13px] font-semibold uppercase tracking-[1.5px] text-[#111111]">
                Monthly item sales
              </h2>
              <span className="rounded-full bg-[#00000008] px-2 py-1 text-[10px] font-medium uppercase tracking-[1px] text-[#0000008C]">
                {reportYear}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[#00000012] text-[#0000008C]">
                    <th className="py-2 px-2 text-left font-medium uppercase">
                      Month
                    </th>
                    <th className="py-2 px-2 text-left font-medium uppercase">
                      Item
                    </th>
                    <th className="py-2 px-2 text-center font-medium uppercase">
                      Qty Sold
                    </th>
                    <th className="py-2 px-2 text-right font-medium uppercase">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyItemSales.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-6 text-center text-[#0000008C]"
                      >
                        No item sales data for this year yet.
                      </td>
                    </tr>
                  )}

                  {monthlyItemSales.map((row) => (
                    <tr
                      key={`${row.monthLabel}-${row.productId || row.productName}`}
                      className="border-b border-[#00000008] hover:bg-[#00000003]"
                    >
                      <td className="py-3 px-2">{row.monthLabel}</td>
                      <td className="py-3 px-2">{row.productName}</td>
                      <td className="py-3 px-2 text-center font-medium">
                        {formatNumber(row.quantity)}
                      </td>
                      <td className="py-3 px-2 text-right font-medium">
                        {formatCurrency(row.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-[28px] border border-[#00000012] bg-white p-5 shadow-[0_10px_40px_rgba(15,15,15,0.04)] lg:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-[13px] font-semibold uppercase tracking-[1.5px] text-[#111111]">
              Sales trend
            </h2>
            <p className="text-[11px] text-[#0000008C]">
              {selectedPeriod} view
            </p>
          </div>

          <div className="max-h-64 space-y-3 overflow-y-auto rounded-2xl border border-dashed border-[#00000012] bg-[#00000003] p-4">
            {trendData.length === 0 && (
              <p className="text-[12px] text-[#0000008C]">
                No trend data for this period.
              </p>
            )}

            {trendData.map((point, index) => {
              const value = Number(point.value || 0);
              const widthPercent =
                maxTrendValue > 0 ? (value / maxTrendValue) * 100 : 0;
              const previousValue =
                index > 0 ? Number(trendData[index - 1]?.value || 0) : value;
              const barColorClass =
                value > previousValue
                  ? "bg-green-600"
                  : value < previousValue
                    ? "bg-red-500"
                    : "bg-gray-500";

              return (
                <div key={point.label}>
                  <div className="mb-1 flex justify-between text-[12px]">
                    <span className="text-[#0000008C]">{point.label}</span>
                    <span className="font-medium">{formatCurrency(value)}</span>
                  </div>

                  <div className="h-2 w-full bg-white">
                    <div
                      className={`h-2 ${barColorClass}`}
                      style={{ width: `${Math.max(widthPercent, 2)}%` }}
              </div>
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
    </div>
  );
}
