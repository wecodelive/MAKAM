const prisma = require("../prisma/index.jsx");

const PERIODS = ["daily", "weekly", "monthly", "yearly"];

const resolvePeriod = (rawPeriod) => {
  const period = String(rawPeriod || "monthly").toLowerCase();
  return PERIODS.includes(period) ? period : "monthly";
};

const getPeriodBoundaries = (period) => {
  const now = new Date();
  const currentStart = new Date(now);

  if (period === "daily") {
    currentStart.setHours(0, 0, 0, 0);
  } else if (period === "weekly") {
    currentStart.setDate(now.getDate() - 6);
    currentStart.setHours(0, 0, 0, 0);
  } else if (period === "monthly") {
    currentStart.setDate(1);
    currentStart.setHours(0, 0, 0, 0);
  } else {
    currentStart.setMonth(0, 1);
    currentStart.setHours(0, 0, 0, 0);
  }

  const windowSize = now.getTime() - currentStart.getTime();
  const previousEnd = new Date(currentStart.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - windowSize);

  return { now, currentStart, previousStart, previousEnd };
};

const calculatePercentageChange = (currentValue, previousValue) => {
  if (!previousValue && !currentValue) return 0;
  if (!previousValue) return 100;

  return ((currentValue - previousValue) / previousValue) * 100;
};

const bucketDate = (date, period) => {
  const value = new Date(date);

  if (period === "daily") {
    return `${value.getHours().toString().padStart(2, "0")}:00`;
  }

  if (period === "weekly") {
    return value.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  if (period === "monthly") {
    return value.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  return value.toLocaleDateString("en-US", { month: "short" });
};

exports.getSalesDashboard = async (req, res) => {
  try {
    const period = resolvePeriod(req.query.period);
    const { now, currentStart, previousStart, previousEnd } =
      getPeriodBoundaries(period);

    const [currentOrders, previousOrders, currentCustomers, previousCustomers] =
      await Promise.all([
        prisma.order.findMany({
          where: {
            placedAt: {
              gte: currentStart,
              lte: now,
            },
          },
          select: {
            totalAmount: true,
            placedAt: true,
          },
        }),
        prisma.order.findMany({
          where: {
            placedAt: {
              gte: previousStart,
              lte: previousEnd,
            },
          },
          select: {
            totalAmount: true,
          },
        }),
        prisma.user.count({
          where: {
            role: "CUSTOMER",
            createdAt: {
              gte: currentStart,
              lte: now,
            },
          },
        }),
        prisma.user.count({
          where: {
            role: "CUSTOMER",
            createdAt: {
              gte: previousStart,
              lte: previousEnd,
            },
          },
        }),
      ]);

    const currentRevenue = currentOrders.reduce(
      (total, order) => total + (order.totalAmount || 0),
      0,
    );
    const previousRevenue = previousOrders.reduce(
      (total, order) => total + (order.totalAmount || 0),
      0,
    );

    const currentOrdersCount = currentOrders.length;
    const previousOrdersCount = previousOrders.length;

    const currentAov = currentOrdersCount
      ? currentRevenue / currentOrdersCount
      : 0;
    const previousAov = previousOrdersCount
      ? previousRevenue / previousOrdersCount
      : 0;

    const revenueTrendMap = currentOrders.reduce((acc, order) => {
      const key = bucketDate(order.placedAt, period);
      acc[key] = (acc[key] || 0) + (order.totalAmount || 0);
      return acc;
    }, {});

    const trend = Object.entries(revenueTrendMap).map(([label, value]) => ({
      label,
      value,
    }));

    res.status(200).json({
      success: true,
      period,
      metrics: {
        totalRevenue: {
          value: currentRevenue,
          change: calculatePercentageChange(currentRevenue, previousRevenue),
        },
        totalOrders: {
          value: currentOrdersCount,
          change: calculatePercentageChange(
            currentOrdersCount,
            previousOrdersCount,
          ),
        },
        newCustomers: {
          value: currentCustomers,
          change: calculatePercentageChange(
            currentCustomers,
            previousCustomers,
          ),
        },
        averageOrderValue: {
          value: currentAov,
          change: calculatePercentageChange(currentAov, previousAov),
        },
      },
      trend,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getTopProducts = async (req, res) => {
  try {
    const period = resolvePeriod(req.query.period);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const { now, currentStart } = getPeriodBoundaries(period);

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          placedAt: {
            gte: currentStart,
            lte: now,
          },
        },
      },
      select: {
        productId: true,
        productNameSnapshot: true,
        quantity: true,
        lineTotal: true,
      },
    });

    const productMap = orderItems.reduce((acc, item) => {
      const key = item.productId || item.productNameSnapshot;
      if (!acc[key]) {
        acc[key] = {
          productId: item.productId,
          name: item.productNameSnapshot || "Unknown Product",
          sales: 0,
          revenue: 0,
        };
      }

      acc[key].sales += item.quantity || 0;
      acc[key].revenue += item.lineTotal || 0;

      return acc;
    }, {});

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, limit);

    res.status(200).json({ success: true, period, topProducts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getMonthlyItemSalesReport = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const year = Math.max(Number(req.query.year) || currentYear, 2000);
    const periodStart = new Date(year, 0, 1);
    const periodEnd = new Date(year + 1, 0, 1);

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          placedAt: {
            gte: periodStart,
            lt: periodEnd,
          },
        },
      },
      select: {
        productId: true,
        productNameSnapshot: true,
        quantity: true,
        lineTotal: true,
        order: {
          select: {
            placedAt: true,
          },
        },
      },
    });

    const reportMap = new Map();

    orderItems.forEach((item) => {
      const orderDate = new Date(item.order.placedAt);
      const monthIndex = orderDate.getMonth();
      const monthLabel = orderDate.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      const productKey =
        item.productId || item.productNameSnapshot || "unknown";
      const reportKey = `${monthIndex}:${productKey}`;

      if (!reportMap.has(reportKey)) {
        reportMap.set(reportKey, {
          monthIndex,
          monthLabel,
          productId: item.productId,
          productName: item.productNameSnapshot || "Unknown Product",
          quantity: 0,
          revenue: 0,
        });
      }

      const currentRow = reportMap.get(reportKey);
      currentRow.quantity += item.quantity || 0;
      currentRow.revenue += item.lineTotal || 0;
    });

    const reportRows = Array.from(reportMap.values())
      .sort(
        (left, right) =>
          left.monthIndex - right.monthIndex ||
          left.productName.localeCompare(right.productName),
      )
      .map(({ monthIndex, ...row }) => row);

    res.status(200).json({
      success: true,
      year,
      rows: reportRows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getCustomerAnalytics = async (req, res) => {
  try {
    const period = resolvePeriod(req.query.period);
    const { now, currentStart } = getPeriodBoundaries(period);

    const [totalCustomers, activeCustomers, customersWithOrders] =
      await Promise.all([
        prisma.user.count({ where: { role: "CUSTOMER" } }),
        prisma.user.count({
          where: {
            role: "CUSTOMER",
            isActive: true,
            isSuspended: false,
          },
        }),
        prisma.user.count({
          where: {
            role: "CUSTOMER",
            orders: {
              some: {
                placedAt: {
                  gte: currentStart,
                  lte: now,
                },
              },
            },
          },
        }),
      ]);

    res.status(200).json({
      success: true,
      period,
      analytics: {
        totalCustomers,
        activeCustomers,
        customersWithOrders,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
