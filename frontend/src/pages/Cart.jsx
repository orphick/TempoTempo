import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import useCartStore from "../store/useCartStore";
import useToastStore from "../store/useToastStore";
import api from "../api/axios";
import styles from "./Cart.module.css";

const CHECKOUT_STEPS = ["سبد خرید", "تخفیف", "ثبت سفارش"];

export default function Cart() {
  const { isAuthenticated } = useAuthStore();
  const { cart, fetchCart, removeFromCart, updateQuantity } = useCartStore();
  const addToast = useToastStore((s) => s.addToast);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponData, setCouponData] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null);

  useEffect(() => {
    async function load() {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        await fetchCart();
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAuthenticated, fetchCart]);

  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const totals = useMemo(() => {
    const originalTotal = Number(cart?.total || 0);
    const discountAmount = Number(couponData?.discount_amount || 0);
    const finalTotal = Number(couponData?.new_total ?? originalTotal);
    return { originalTotal, discountAmount, finalTotal };
  }, [cart?.total, couponData]);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      const res = await api.post("/coupon/validate/", { code: couponInput });
      setCouponData(res.data);
      addToast(`کد تخفیف اعمال شد — ${res.data.discount_amount}$ تخفیف`, "success");
    } catch (err) {
      addToast(err.response?.data?.error || "کد تخفیف معتبر نیست", "error");
      setCouponData(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponData(null);
    setCouponInput("");
    addToast("کد تخفیف حذف شد", "info");
  };

  const handleQuantity = async (itemId, quantity) => {
    setUpdatingItemId(itemId);
    try {
      await updateQuantity(itemId, quantity);
      setCouponData(null);
    } catch (err) {
      addToast(err.response?.data?.error || "امکان تغییر تعداد وجود ندارد", "error");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemove = async (itemId) => {
    setUpdatingItemId(itemId);
    try {
      await removeFromCart(itemId);
      setCouponData(null);
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      await api.post("/checkout/", {
        coupon_code: couponData?.code || "",
      });
      await fetchCart();
      setCouponData(null);
      setCouponInput("");
      addToast("سفارش شما با موفقیت ثبت شد", "success");
      setTimeout(() => navigate("/orders"), 900);
    } catch (err) {
      addToast(err.response?.data?.error || "خطا در ثبت سفارش. لطفاً دوباره امتحان کنید.", "error");
    } finally {
      setCheckingOut(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className={styles.wrapper}>
        <section className={styles.stateCard}>
          <span className={styles.stateKicker}>Cart Access</span>
          <h1>برای مشاهده سبد خرید وارد حساب شوید</h1>
          <p>سبد خرید، کد تخفیف و سفارش‌های شما به حساب کاربری متصل هستند.</p>
          <div className={styles.stateActions}>
            <Link to="/login" className={styles.primaryLink}>ورود</Link>
            <Link to="/register" className={styles.secondaryLink}>ثبت‌نام</Link>
          </div>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className={styles.wrapper}>
        <section className={styles.stateCard}>
          <span className={styles.stateKicker}>Loading</span>
          <h1>در حال آماده‌سازی سبد خرید...</h1>
        </section>
      </main>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className={styles.wrapper}>
        <section className={styles.stateCard}>
          <span className={styles.stateKicker}>Empty Cart</span>
          <h1>سبد خرید شما خالی است</h1>
          <p>از فروشگاه محصول دلخواه را انتخاب کن و دوباره به این بخش برگرد.</p>
          <div className={styles.stateActions}>
            <Link to="/shop" className={styles.primaryLink}>مشاهده فروشگاه</Link>
            <Link to="/" className={styles.secondaryLink}>صفحه اصلی</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.wrapper}>
      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>Checkout</p>
          <h1>سبد خرید و ثبت سفارش</h1>
          <p>محصولات انتخاب‌شده، کد تخفیف و مجموع نهایی را قبل از ثبت سفارش بررسی کن.</p>
        </div>
        <div className={styles.heroStats}>
          <span>
            <strong>{itemCount}</strong>
            آیتم در سبد
          </span>
          <span>
            <strong>${totals.finalTotal.toFixed(2)}</strong>
            مبلغ نهایی
          </span>
        </div>
      </section>

      <div className={styles.steps}>
        {CHECKOUT_STEPS.map((step, index) => (
          <div key={step} className={styles.step}>
            <span>{index + 1}</span>
            <strong>{step}</strong>
          </div>
        ))}
      </div>

      <section className={styles.layout}>
        <div className={styles.itemsPanel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.kicker}>Items</span>
              <h2>محصولات انتخاب‌شده</h2>
            </div>
            <Link to="/shop">افزودن محصول</Link>
          </div>

          <div className={styles.itemsList}>
            {cart.items.map((item) => (
              <article key={item.id} className={styles.item}>
                <div className={styles.itemMark}>TT</div>
                <div className={styles.itemInfo}>
                  <h3>{item.variant.name}</h3>
                  <p>${item.variant.price} برای هر عدد</p>
                </div>

                <div className={styles.qtyControls} aria-label="تغییر تعداد">
                  <button
                    onClick={() => handleQuantity(item.id, Math.max(1, item.quantity - 1))}
                    disabled={updatingItemId === item.id || item.quantity <= 1}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => handleQuantity(item.id, item.quantity + 1)}
                    disabled={updatingItemId === item.id}
                  >
                    +
                  </button>
                </div>

                <strong className={styles.itemPrice}>${item.subtotal}</strong>
                <button
                  className={styles.removeBtn}
                  onClick={() => handleRemove(item.id)}
                  disabled={updatingItemId === item.id}
                >
                  حذف
                </button>
              </article>
            ))}
          </div>
        </div>

        <aside className={styles.summary}>
          <div className={styles.summaryHeader}>
            <span className={styles.kicker}>Summary</span>
            <h2>خلاصه سفارش</h2>
          </div>

          <div className={styles.summaryRows}>
            {cart.items.map((item) => (
              <div key={item.id} className={styles.summaryRow}>
                <span>{item.variant.name} × {item.quantity}</span>
                <strong>${item.subtotal}</strong>
              </div>
            ))}
          </div>

          <div className={styles.couponBox}>
            <label>کد تخفیف</label>
            {couponData ? (
              <div className={styles.appliedCoupon}>
                <div>
                  <strong>{couponData.code}</strong>
                  <span>${totals.discountAmount.toFixed(2)} تخفیف</span>
                </div>
                <button onClick={removeCoupon}>حذف</button>
              </div>
            ) : (
              <div className={styles.couponInput}>
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                  placeholder="DEMO10"
                  dir="ltr"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponInput.trim()}
                >
                  {couponLoading ? "..." : "اعمال"}
                </button>
              </div>
            )}
          </div>

          <div className={styles.totalBox}>
            <div>
              <span>جمع محصولات</span>
              <strong>${totals.originalTotal.toFixed(2)}</strong>
            </div>
            {couponData && (
              <div className={styles.discountRow}>
                <span>تخفیف</span>
                <strong>-${totals.discountAmount.toFixed(2)}</strong>
              </div>
            )}
            <div className={styles.finalTotal}>
              <span>مجموع نهایی</span>
              <strong>${totals.finalTotal.toFixed(2)}</strong>
            </div>
          </div>

          <button
            className={styles.checkoutBtn}
            onClick={handleCheckout}
            disabled={checkingOut}
          >
            {checkingOut ? "در حال ثبت سفارش..." : "ثبت سفارش"}
          </button>

          <p className={styles.summaryNote}>
            با ثبت سفارش، موجودی محصول دوباره بررسی می‌شود و سپس سفارش در حساب شما ذخیره می‌شود.
          </p>
        </aside>
      </section>
    </main>
  );
}
