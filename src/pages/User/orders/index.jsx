import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, CalendarDays, CreditCard, Package, Truck } from "lucide-react";
import OrderCard from "./components/orderCard";
import {
  getCustomerOrderDetails,
  getCustomerOrders,
} from "../../../services/adminFunctions";
import { notifyError } from "../../../utils/notify";

export default function Orders() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [loadingOrder, setLoadingOrder] = React.useState(false);
  const [orderDetails, setOrderDetails] = React.useState(null);
  const [ordersLoading, setOrdersLoading] = React.useState(false);
  const [ordersList, setOrdersList] = React.useState([]);
  const [ordersPagination, setOrdersPagination] = React.useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  React.useEffect(() => {
    if (localStorage.getItem("adminId")) {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  const formatDate = (value) => {
    if (!value) {
      return "Pending";
    }

    return new Intl.DateTimeFormat("en-NG", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  };

  React.useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setOrderDetails(null);
        return;
      }

      try {
        setLoadingOrder(true);
        const payload = await getCustomerOrderDetails(orderId);

        if (!payload.success) {
          throw new Error(payload.message || "Unable to load order");
        }

        setOrderDetails(payload.order || null);
      } catch (error) {
        console.error("Error loading order details:", error);
        notifyError(error.message || "Unable to load order");
        setOrderDetails(null);
      } finally {
        setLoadingOrder(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  React.useEffect(() => {
    const fetchOrders = async () => {
      if (orderId) {
        return;
      }

      try {
        setOrdersLoading(true);
        const payload = await getCustomerOrders({ page: 1, limit: 20 });

        if (!payload.success) {
          throw new Error(payload.message || "Unable to load orders");
        }

        setOrdersList(payload.orders || []);
        setOrdersPagination({
          page: payload.pagination?.page || 1,
          totalPages: payload.pagination?.totalPages || 1,
          total: payload.pagination?.total || 0,
        });
      } catch (error) {
        console.error("Error loading orders list:", error);
        notifyError(error.message || "Unable to load orders");
        setOrdersList([]);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [orderId]);

  const mappedOrders = React.useMemo(
    () =>
      ordersList.map((order) => {
        const firstItem = order.items?.[0];

        return {
          image: firstItem?.imageSnapshot || "/placeHolder.jpg",
          orderTitle: firstItem?.productNameSnapshot || "Order Item",
          orderStatus: order.status,
          orderColour: order.customerEmail || "Customer",
          orderSize: `${order._count?.items || 0} item${(order._count?.items || 0) > 1 ? "s" : ""}`,
          orderNo: order.orderNumber,
          orderCost: formatCurrency(order.totalAmount),
          id: order.id,
        };
      }),
    [ordersList],
  );

  if (orderId) {
    const paymentMethod = String(orderDetails?.payment?.metadata?.method || "CARD")
      .toUpperCase()
      .replace(/_/g, " ");
    const estimatedDeliveryDate =
      orderDetails?.shipment?.estimatedDeliveryAt ||
      orderDetails?.deliveredAt ||
      orderDetails?.placedAt;

    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#FBFBF8_0%,#FFFFFF_45%,#F7F5F0_100%)] px-4 py-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-4">
          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="w-fit text-[12px] font-medium text-[#0000008C] transition-opacity hover:opacity-70"
          >
            Back to orders
          </button>

          {loadingOrder ? (
            <p className="text-[13px] text-[#0000008C]">Loading order...</p>
          ) : !orderDetails ? (
            <p className="text-[13px] text-[#0000008C]">Order not found.</p>
          ) : (
            <section className="overflow-hidden rounded-[28px] border border-[#00000012] bg-white shadow-[0_10px_40px_rgba(15,15,15,0.04)]">
              <div className="bg-[#111111] px-5 py-5 text-white lg:px-6 lg:py-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[1.5px] text-white/60">
                      Receipt
                    </p>
                    <h1 className="mt-2 text-[24px] font-black leading-tight tracking-[2px] uppercase lg:text-[30px]">
                      Order confirmed
                    </h1>
                  </div>

                  <div className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[1px] text-white">
                    {orderDetails.status}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-6">
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-[#00000012] bg-[#00000003] p-4">
                      <div className="flex items-center gap-2 text-[#0000008C]">
                        <Package size={16} />
                        <span className="text-[11px] uppercase tracking-[1px]">
                          Order number
                        </span>
                      </div>
                      <p className="mt-2 text-[14px] font-bold text-[#111111]">
                        {orderDetails.orderNumber}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[#00000012] bg-[#00000003] p-4">
                      <div className="flex items-center gap-2 text-[#0000008C]">
                        <CalendarDays size={16} />
                        <span className="text-[11px] uppercase tracking-[1px]">
                          Delivery date
                        </span>
                      </div>
                      <p className="mt-2 text-[14px] font-bold text-[#111111]">
                        {formatDate(estimatedDeliveryDate)}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-[#00000012] bg-[#00000003] p-4">
                      <div className="flex items-center gap-2 text-[#0000008C]">
                        <CreditCard size={16} />
                        <span className="text-[11px] uppercase tracking-[1px]">
                          Payment type
                        </span>
                      </div>
                      <p className="mt-2 text-[14px] font-bold text-[#111111]">
                        {paymentMethod}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[#00000012] bg-[#00000003] p-4">
                      <div className="flex items-center gap-2 text-[#0000008C]">
                        <Truck size={16} />
                        <span className="text-[11px] uppercase tracking-[1px]">
                          Delivery status
                        </span>
                      </div>
                      <p className="mt-2 text-[14px] font-bold text-[#111111]">
                        {orderDetails.shipment?.status || "PENDING"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#00000012] bg-[#111111] px-4 py-4 text-white">
                    <p className="text-[11px] uppercase tracking-[1.5px] text-white/60">
                      Order summary
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-[12px] text-white/70">Total paid</span>
                      <strong className="text-[18px]">
                        {formatCurrency(orderDetails.totalAmount)}
                      </strong>
                    </div>
                    <p className="mt-2 text-[12px] leading-6 text-white/75">
                      Keep this receipt for your records. The items ordered and your expected
                      delivery date are shown below.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#00000012] p-4">
                    <h2 className="text-[13px] font-semibold uppercase tracking-[1px] text-[#111111]">
                      Items ordered
                    </h2>
                    <div className="mt-3 flex flex-col gap-y-2">
                      {(orderDetails.items || []).map((item) => (
                        <article
                          key={item.id}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-[#00000010] bg-[#00000003] p-3"
                        >
                          <div>
                            <p className="text-[12px] font-semibold text-[#111111]">
                              {item.productNameSnapshot}
                            </p>
                            <p className="mt-1 text-[11px] text-[#0000008C]">
                              Qty: {item.quantity} - {item.skuSnapshot || "SKU not set"}
                            </p>
                          </div>
                          <p className="text-[12px] font-semibold text-[#111111]">
                            {formatCurrency(item.lineTotal)}
                          </p>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>

                <aside className="rounded-2xl border border-[#00000012] bg-[#00000003] p-4 lg:sticky lg:top-6 lg:self-start">
                  <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#0000008C]">
                    Next steps
                  </p>

                  <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-[12px] font-semibold text-[#111111]">Delivery window</p>
                    <p className="mt-1 text-[12px] leading-6 text-[#0000008C]">
                      Your order is expected by {formatDate(estimatedDeliveryDate)}.
                    </p>
                  </div>

                  <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-[12px] font-semibold text-[#111111]">Keep this receipt</p>
                    <p className="mt-1 text-[12px] leading-6 text-[#0000008C]">
                      Use the order number if you need support or want to track this order later.
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => navigate("/orders")}
                      className="inline-flex h-11 items-center justify-between rounded-2xl bg-[#111111] px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
                    >
                      View orders
                      <ArrowRight size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/products")}
                      className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#00000014] bg-white px-4 text-[13px] font-medium text-[#111111] transition-opacity hover:opacity-80"
                    >
                      Continue shopping
                    </button>
                  </div>
                </aside>
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="px-4">
        <h1 className="pb-3.25 font-extrabold text-[20px] leading-10 tracking-[2px]">
          Orders
        </h1>

        {ordersLoading ? (
          <p className="text-[13px] text-[#0000008C]">Loading orders...</p>
        ) : mappedOrders.length === 0 ? (
          <p className="text-[13px] text-[#0000008C]">No orders yet.</p>
        ) : (
          <>
            <div className="my-2 flex flex-col gap-y-2">
              {mappedOrders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  className="text-left"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <OrderCard order={order} />
                </button>
              ))}
            </div>

            <p className="text-[12px] text-[#0000008C]">
              Showing {mappedOrders.length} of {ordersPagination.total} order
              {ordersPagination.total === 1 ? "" : "s"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
