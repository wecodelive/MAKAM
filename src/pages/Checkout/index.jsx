import React from "react";
import { Input } from "../../components/Inputs";
import Button from "../../components/Buttons";
import { MoveLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OrderCard from "./components/OrderCard";
import {
  APP_CART_UPDATED_EVENT,
  clearCart,
  getCartSummary,
} from "../../utils/cart";
import { placeCheckoutOrder } from "../../services/adminFunctions";
import { notifyError, notifySuccess } from "../../utils/notify";

const Checkout = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    country: "",
    region: "",
    address: "",
    city: "",
    postalCode: "",
    paymentMethod: "CARD",
  });
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [cartSummary, setCartSummary] = useState(() => getCartSummary());
  const paymentOptions = React.useMemo(
    () => [
      {
        value: "CARD",
        title: "Card payment",
        description: "Pay instantly with your debit or credit card.",
        hint: "Fast confirmation",
      },
      {
        value: "TRANSFER",
        title: "Bank transfer",
        description: "Choose this if you want to transfer from your bank.",
        hint: "Manual confirmation",
      },
    ],
    [],
  );

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  React.useEffect(() => {
    const syncCart = () => {
      setCartSummary(getCartSummary());
    };

    syncCart();
    window.addEventListener(APP_CART_UPDATED_EVENT, syncCart);

    return () => {
      window.removeEventListener(APP_CART_UPDATED_EVENT, syncCart);
    };
  }, []);

  const orders = React.useMemo(
    () =>
      cartSummary.items.map((item) => ({
        productId: item.productId,
        image: item.image || "/placeHolder.jpg",
        orderTitle: item.name,
        orderColour: item.categoryName || "Standard",
        orderSize: "-",
        orderNo: String(item.quantity),
        orderCost: formatCurrency(
          (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0),
        ),
      })),
    [cartSummary.items],
  );

  const estimatedDeliveryDate = React.useMemo(() => {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5);
    return new Intl.DateTimeFormat("en-NG", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(deliveryDate);
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!cartSummary.items.length) {
      notifyError("Your cart is empty.");
      return;
    }

    if (!formData.email.trim()) {
      notifyError("Email is required to place order.");
      return;
    }

    try {
      setSubmittingOrder(true);

      const payload = {
        customer: {
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
        },
        shippingAddress: {
          country: formData.country.trim(),
          region: formData.region.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          postalCode: formData.postalCode.trim(),
        },
        paymentMethod: formData.paymentMethod,
        items: cartSummary.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      const response = await placeCheckoutOrder(payload);

      if (!response.success) {
        throw new Error(response.message || "Unable to place order");
      }

      clearCart();
      notifySuccess("Order placed successfully.");
      navigate(`/orders/${response.order.id}`);
    } catch (error) {
      console.error("Error placing checkout order:", error);
      notifyError(error.message || "Unable to place order");
    } finally {
      setSubmittingOrder(false);
    }
  };
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#FBFBF8_0%,#FFFFFF_45%,#F7F5F0_100%)] px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          className="mb-6 inline-flex items-center gap-2 text-[12px] font-medium text-[#0000008C] transition-opacity hover:opacity-70"
          onClick={() => navigate(-1)}
        >
          <MoveLeft size={16} /> Back
        </button>

        <div className="mb-6 flex flex-col gap-3">
          <div className="inline-flex w-fit items-center rounded-full border border-[#00000014] bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-[1px] text-[#0000008C] shadow-sm">
            Guest checkout available
          </div>
          <div className="max-w-2xl">
            <h1 className="text-[28px] font-black leading-tight tracking-[2px] uppercase text-[#111111] lg:text-[36px]">
              Secure checkout
            </h1>
            <p className="mt-2 max-w-xl text-[13px] leading-6 text-[#0000008C]">
              Review your items, choose a payment method, and confirm your
              delivery details in one clean flow.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-medium uppercase tracking-[1px] text-[#0000008C]">
            <span className="rounded-full border border-[#00000014] bg-white px-3 py-1 shadow-sm">
              1. Information
            </span>
            <span className="rounded-full border border-[#00000014] bg-white px-3 py-1 shadow-sm">
              2. Shipping
            </span>
            <span className="rounded-full border border-[#00000014] bg-white px-3 py-1 shadow-sm">
              3. Payment
            </span>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <fieldset className="rounded-3xl border border-[#00000012] bg-white p-5 shadow-[0_10px_40px_rgba(15,15,15,0.04)] lg:p-6">
              <legend className="px-2 text-[11px] font-semibold uppercase tracking-[1.5px] text-[#0000008C]">
                Contact info
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label=""
                  placeholder="Email"
                  id="checkoutMail"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  type="email"
                />
                <Input
                  label=""
                  placeholder="Phone"
                  id="checkoutPhone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  type="tel"
                />
              </div>
            </fieldset>

            <fieldset className="rounded-3xl border border-[#00000012] bg-white p-5 shadow-[0_10px_40px_rgba(15,15,15,0.04)] lg:p-6">
              <legend className="px-2 text-[11px] font-semibold uppercase tracking-[1.5px] text-[#0000008C]">
                Shipping address
              </legend>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label=""
                  placeholder="First Name"
                  id="checkoutFirstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  type="text"
                />

                <Input
                  label=""
                  placeholder="Last Name"
                  id="checkoutLastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  type="text"
                />
              </div>

              <div className="mt-3 grid gap-3">
                <Input
                  label=""
                  placeholder="Country"
                  id="checkoutCountry"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  type="text"
                />
                <Input
                  label=""
                  placeholder="State / Region"
                  id="checkoutRegion"
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  type="text"
                />
                <Input
                  label=""
                  placeholder="Address"
                  id="checkoutAddress"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  type="text"
                />
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Input
                  label=""
                  placeholder="City"
                  id="checkoutCity"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  type="text"
                />
                <Input
                  label=""
                  placeholder="Postal Code"
                  id="checkoutPostal"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  type="text"
                />
              </div>
            </fieldset>

            <fieldset className="rounded-3xl border border-[#00000012] bg-white p-5 shadow-[0_10px_40px_rgba(15,15,15,0.04)] lg:p-6">
              <legend className="px-2 text-[11px] font-semibold uppercase tracking-[1.5px] text-[#0000008C]">
                Payment
              </legend>

              <div className="grid gap-3 sm:grid-cols-2">
                {paymentOptions.map((option) => {
                  const isSelected = formData.paymentMethod === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          paymentMethod: option.value,
                        }))
                      }
                      className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                        isSelected
                          ? "border-[#111111] bg-[#111111] text-white shadow-lg"
                          : "border-[#00000014] bg-white text-[#111111] hover:border-[#11111155]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[13px] font-semibold">
                            {option.title}
                          </p>
                          <p
                            className={`mt-1 text-[11px] leading-5 ${
                              isSelected ? "text-white/75" : "text-[#0000008C]"
                            }`}
                          >
                            {option.description}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[1px] ${
                            isSelected
                              ? "bg-white/15 text-white"
                              : "bg-[#00000008] text-[#0000008C]"
                          }`}
                        >
                          {option.hint}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 rounded-2xl border border-dashed border-[#00000018] bg-[#00000003] p-4 text-[12px] leading-6 text-[#0000008C]">
                <p className="font-medium text-[#111111]">
                  {formData.paymentMethod === "TRANSFER"
                    ? "Bank transfer selected"
                    : "Card payment selected"}
                </p>
                <p className="mt-1">
                  {formData.paymentMethod === "TRANSFER"
                    ? "You will be redirected or shown transfer instructions after order confirmation."
                    : "Your payment will be confirmed instantly through the card gateway."}
                </p>
              </div>

              <p className="mt-3 text-[11px] leading-5 text-[#0000008C]">
                Expected delivery: {estimatedDeliveryDate}. Orders remain
                pending until payment is confirmed.
              </p>
            </fieldset>

            <Button
              className="h-12 w-full rounded-2xl bg-[#111111] text-white shadow-[0_18px_40px_rgba(17,17,17,0.18)]"
              value={submittingOrder ? "PROCESSING..." : "PLACE ORDER"}
              showArrow={true}
              disabled={submittingOrder}
            />
          </form>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-[28px] border border-[#00000012] bg-white p-5 shadow-[0_10px_40px_rgba(15,15,15,0.04)] lg:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[13px] font-semibold uppercase tracking-[1.5px] text-[#111111]">
                  Order summary
                </h2>
                <span className="rounded-full bg-[#00000008] px-2 py-1 text-[10px] font-medium uppercase tracking-[1px] text-[#0000008C]">
                  {orders.length} item{orders.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-4 max-h-90 space-y-3 overflow-y-auto pr-1">
                {orders.length === 0 ? (
                  <p className="text-[12px] text-[#0000008C]">
                    Your cart is empty. Add items before checkout.
                  </p>
                ) : (
                  orders.map((order) => (
                    <OrderCard
                      key={order.productId}
                      order={order}
                      onChange={() => navigate(`/product/${order.productId}`)}
                    />
                  ))
                )}
              </div>

              <div className="mt-6 space-y-3 border-t border-[#00000010] pt-5">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-medium text-[#0000008C]">Subtotal</span>
                  <span className="font-semibold text-[#111111]">
                    {formatCurrency(cartSummary.subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-medium text-[#0000008C]">Shipping</span>
                  <span className="font-semibold text-[#0000008C]">
                    Calculated at next step
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-[#00000010] pt-3 text-[14px]">
                  <span className="font-semibold text-[#111111]">Total</span>
                  <span className="font-black text-[#111111]">
                    {formatCurrency(cartSummary.total)}
                  </span>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-[#111111] px-4 py-4 text-white">
                <p className="text-[11px] uppercase tracking-[1.5px] text-white/60">
                  Delivery note
                </p>
                <p className="mt-2 text-[12px] leading-6 text-white/85">
                  Your receipt will show the items ordered and the delivery date
                  once checkout is complete.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
};

export default Checkout;
