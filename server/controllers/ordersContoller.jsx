const prisma = require("../prisma/index.jsx");

const ORDER_STATUSES = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const SHIPMENT_STATUSES = [
  "PENDING",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED",
  "RETURNED",
];

const PAYMENT_METHODS = ["CARD", "TRANSFER"];
const DELIVERY_WINDOW_DAYS = 5;

const resolvePaymentMethod = (rawPaymentMethod) => {
  const paymentMethod = String(rawPaymentMethod || "CARD")
    .trim()
    .toUpperCase();
  return PAYMENT_METHODS.includes(paymentMethod) ? paymentMethod : "CARD";
};

const calculateEstimatedDeliveryDate = (placedAt = new Date()) => {
  const estimatedDeliveryAt = new Date(placedAt);
  estimatedDeliveryAt.setDate(
    estimatedDeliveryAt.getDate() + DELIVERY_WINDOW_DAYS,
  );
  return estimatedDeliveryAt;
};

const generateOrderNumber = () =>
  `MKM-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

const generatePaymentReference = (orderNumber) =>
  `${orderNumber}-PAY-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

exports.getPublicOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, email, status, q } = req.query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(limit) || 10, 1), 50);
    const skip = (pageNumber - 1) * pageSize;

    const where = {
      ...(email
        ? { customerEmail: { equals: String(email).toLowerCase() } }
        : {}),
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { orderNumber: { contains: q, mode: "insensitive" } },
              { customerEmail: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          items: {
            orderBy: { createdAt: "asc" },
            take: 1,
          },
          _count: {
            select: { items: true },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    const totalPages = Math.max(Math.ceil(total / pageSize), 1);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getPublicOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { email } = req.query;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        shipment: true,
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (
      email &&
      String(email).toLowerCase() !==
        String(order.customerEmail || "").toLowerCase()
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied for this order" });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { customer, shippingAddress, items, notes, paymentMethod } = req.body;

    const email = String(customer?.email || "")
      .trim()
      .toLowerCase();
    const phone = String(customer?.phone || "").trim();
    const firstName = String(customer?.firstName || "").trim();
    const lastName = String(customer?.lastName || "").trim();
    const fullName =
      [firstName, lastName].filter(Boolean).join(" ") || "Guest Customer";

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Customer email is required" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Order items are required" });
    }

    const normalizedItems = items
      .map((item) => ({
        productId: String(item?.productId || "").trim(),
        quantity: Math.max(Number(item?.quantity) || 0, 0),
      }))
      .filter((item) => item.productId && item.quantity > 0);

    if (normalizedItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No valid order items provided" });
    }

    const uniqueProductIds = [
      ...new Set(normalizedItems.map((item) => item.productId)),
    ];
    const resolvedPaymentMethod = resolvePaymentMethod(paymentMethod);

    const order = await prisma.$transaction(
      async (tx) => {
        const products = await tx.product.findMany({
          where: { id: { in: uniqueProductIds } },
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            stockQuantity: true,
            images: true,
          },
        });

        if (products.length !== uniqueProductIds.length) {
          throw new Error("One or more products no longer exist");
        }

        const productsById = new Map(
          products.map((product) => [product.id, product]),
        );

        const orderItemsData = normalizedItems.map((item) => {
          const product = productsById.get(item.productId);
          if (!product) {
            throw new Error("Invalid product in cart");
          }

          if (product.stockQuantity < item.quantity) {
            throw new Error(`${product.name} does not have enough stock`);
          }

          const unitPrice = Number(product.price || 0);
          return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice,
            lineTotal: unitPrice * item.quantity,
            productNameSnapshot: product.name,
            skuSnapshot: product.sku || null,
            imageSnapshot: Array.isArray(product.images)
              ? product.images[0] || null
              : null,
          };
        });

        const subtotalAmount = orderItemsData.reduce(
          (sum, item) => sum + item.lineTotal,
          0,
        );
        const estimatedDeliveryAt = calculateEstimatedDeliveryDate();

        const user = await tx.user.upsert({
          where: { email },
          update: {
            name: fullName,
            firstName: firstName || null,
            lastName: lastName || null,
            phone: phone || null,
          },
          create: {
            email,
            password: `checkout_${Date.now()}`,
            name: fullName,
            firstName: firstName || null,
            lastName: lastName || null,
            phone: phone || null,
            role: "CUSTOMER",
          },
        });

        let shippingAddressId = null;
        if (
          shippingAddress?.country ||
          shippingAddress?.address ||
          shippingAddress?.city
        ) {
          const address = await tx.address.create({
            data: {
              userId: user.id,
              firstName: firstName || "Guest",
              lastName: lastName || "Customer",
              phone: phone || null,
              country: String(shippingAddress?.country || "Nigeria"),
              state: String(shippingAddress?.region || "Lagos"),
              city: String(shippingAddress?.city || "Lagos"),
              addressLine1: String(
                shippingAddress?.address || "Address pending",
              ),
              postalCode: String(shippingAddress?.postalCode || ""),
            },
          });

          shippingAddressId = address.id;
        }

        const totalAmount = subtotalAmount;
        const paymentReference = generatePaymentReference(
          generateOrderNumber(),
        );

        const createdOrder = await tx.order.create({
          data: {
            orderNumber: generateOrderNumber(),
            userId: user.id,
            status: "PENDING",
            paymentStatus: "UNPAID",
            fulfillmentStatus: "UNFULFILLED",
            currency: "NGN",
            subtotalAmount,
            shippingAmount: 0,
            taxAmount: 0,
            discountAmount: 0,
            totalAmount,
            customerEmail: email,
            customerPhone: phone || null,
            notes: notes?.trim() || null,
            shippingAddressId,
            billingAddressId: shippingAddressId,
            items: {
              create: orderItemsData,
            },
            payment: {
              create: {
                provider: "MANUAL",
                providerReference: paymentReference,
                amount: totalAmount,
                currency: "NGN",
                status: "PENDING",
                metadata: {
                  method: resolvedPaymentMethod,
                  channel: "CHECKOUT",
                },
              },
            },
            shipment: {
              create: {
                status: "PENDING",
                estimatedDeliveryAt,
              },
            },
            statusHistory: {
              create: {
                toStatus: "PENDING",
                note: "Order placed from checkout",
              },
            },
          },
          include: {
            items: true,
            payment: true,
            shipment: true,
          },
        });

        await Promise.all(
          normalizedItems.map((item) =>
            tx.product.update({
              where: { id: item.productId },
              data: {
                stockQuantity: {
                  decrement: item.quantity,
                },
              },
            }),
          ),
        );

        return createdOrder;
      },
      {
        maxWait: 10000,
        timeout: 15000,
      },
    );

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      q,
      status,
      paymentStatus,
      fulfillmentStatus,
    } = req.query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(limit) || 10, 1), 50);
    const skip = (pageNumber - 1) * pageSize;

    const where = {
      ...(status ? { status } : {}),
      ...(paymentStatus ? { paymentStatus } : {}),
      ...(fulfillmentStatus ? { fulfillmentStatus } : {}),
      ...(q
        ? {
            OR: [
              { orderNumber: { contains: q, mode: "insensitive" } },
              { customerEmail: { contains: q, mode: "insensitive" } },
              { customerPhone: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { items: true },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    const totalPages = Math.max(Math.ceil(total / pageSize), 1);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        items: {
          orderBy: { createdAt: "asc" },
        },
        payment: true,
        shipment: true,
        refunds: {
          orderBy: { createdAt: "desc" },
        },
        shippingAddress: true,
        billingAddress: true,
        statusHistory: {
          orderBy: { createdAt: "desc" },
          include: {
            changedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;

    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const timestampUpdates = {};
    if (status === "SHIPPED") {
      timestampUpdates.shippedAt = existingOrder.shippedAt || new Date();
      timestampUpdates.fulfillmentStatus = "PARTIALLY_FULFILLED";
    }
    if (status === "DELIVERED") {
      timestampUpdates.deliveredAt = existingOrder.deliveredAt || new Date();
      timestampUpdates.fulfillmentStatus = "FULFILLED";
    }
    if (status === "CANCELLED") {
      timestampUpdates.cancelledAt = existingOrder.cancelledAt || new Date();
      timestampUpdates.fulfillmentStatus = "RETURNED";
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...timestampUpdates,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { items: true },
        },
      },
    });

    if (existingOrder.status !== status) {
      await prisma.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: existingOrder.status,
          toStatus: status,
          note: note?.trim() || null,
        },
      });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (existingOrder.status === "CANCELLED") {
      return res
        .status(400)
        .json({ success: false, message: "Order is already cancelled" });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        cancelledAt: existingOrder.cancelledAt || new Date(),
        cancelReason: reason?.trim() || null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { items: true },
        },
      },
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: existingOrder.status,
        toStatus: "CANCELLED",
        note: reason?.trim() || null,
      },
    });

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.processOrderRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { amount, reason } = req.body;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const refundAmount = Number(amount);
    if (!refundAmount || refundAmount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Valid refund amount is required" });
    }

    const totalRefunded = await prisma.refund.aggregate({
      where: { orderId },
      _sum: { amount: true },
    });

    const refundedAmount = totalRefunded._sum.amount || 0;
    const remainingRefundable = order.totalAmount - refundedAmount;

    if (refundAmount > remainingRefundable) {
      return res.status(400).json({
        success: false,
        message: "Refund amount exceeds refundable balance",
      });
    }

    const refund = await prisma.refund.create({
      data: {
        orderId,
        amount: refundAmount,
        reason: reason?.trim() || null,
        status: "COMPLETED",
        processedAt: new Date(),
      },
    });

    const newRefundedTotal = refundedAmount + refundAmount;
    const nextPaymentStatus =
      newRefundedTotal >= order.totalAmount ? "REFUNDED" : "PARTIALLY_REFUNDED";

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: nextPaymentStatus,
      },
      include: {
        refunds: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    res.status(200).json({
      success: true,
      refund,
      order: updatedOrder,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.addOrderTracking = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { carrier, trackingNumber, trackingUrl, status } = req.body;

    if (status && !SHIPMENT_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid shipment status" });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!existingOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const shipment = await prisma.shipment.upsert({
      where: { orderId },
      create: {
        orderId,
        carrier: carrier?.trim() || null,
        trackingNumber: trackingNumber?.trim() || null,
        trackingUrl: trackingUrl?.trim() || null,
        status: status || "PENDING",
        shippedAt: status === "IN_TRANSIT" ? new Date() : null,
        deliveredAt: status === "DELIVERED" ? new Date() : null,
      },
      update: {
        carrier: carrier?.trim() || undefined,
        trackingNumber: trackingNumber?.trim() || undefined,
        trackingUrl: trackingUrl?.trim() || undefined,
        status: status || undefined,
        shippedAt: status === "IN_TRANSIT" ? new Date() : undefined,
        deliveredAt: status === "DELIVERED" ? new Date() : undefined,
      },
    });

    let fulfillmentStatusUpdate;
    if (shipment.status === "DELIVERED") {
      fulfillmentStatusUpdate = "FULFILLED";
    } else if (
      shipment.status === "IN_TRANSIT" ||
      shipment.status === "OUT_FOR_DELIVERY"
    ) {
      fulfillmentStatusUpdate = "PARTIALLY_FULFILLED";
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        ...(fulfillmentStatusUpdate
          ? { fulfillmentStatus: fulfillmentStatusUpdate }
          : {}),
        ...(shipment.status === "DELIVERED"
          ? { status: "DELIVERED", deliveredAt: new Date() }
          : {}),
      },
      include: {
        shipment: true,
      },
    });

    res.status(200).json({ success: true, shipment, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
