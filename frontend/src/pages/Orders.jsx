import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import useAuthStore from "../store/useAuthStore";
import { formatCurrency } from "../utils/formatters";
import styles from "./Orders.module.css";

const STATUS = {
  pending: { label: "در انتظار", tone: "warning", step: 1 },
  processing: { label: "در حال پردازش", tone: "info", step: 2 },
  completed: { label: "تکمیل شده", tone: "success", step: 3 },
  cancelled: { label: "لغو شده", tone: "danger", step: 0 },
};

const STATUS_STEPS = ["ثبت سفارش", "پردازش", "تکمیل"];

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function OrderStatus({ status }) {
  const info = STATUS[status] || STATUS.pending;
  return <span className={`${styles.statusBadge} ${styles[info.tone]}`}>{info.label}</span>;
}

export default function Orders() {
  const { isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await api.get("/orders/");
        setOrders(res.data);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [isAuthenticated]);

  const stats = useMemo(() => {
    const totalSpent = orders.reduce((sum, order) => sum + Number(order.total_price || 0), 0);
    const completed = orders.filter((order) => order.status === "completed").length;
    const pending = orders.filter((order) => ["pending", "processing"].includes(order.status)).length;
    return { totalSpent, completed, pending };
  }, [orders]);

  if (!isAuthenticated) {
    return (
      <main className={styles.wrapper}>
        <section className={styles.stateCard}>
          <span className={styles.kicker}>دسترسی سفارش‌ها</span>
          <h1>برای مشاهده سفارش‌ها وارد حساب شوید</h1>
          <p>تاریخچه خرید، وضعیت سفارش و جزئیات محصولات خریداری‌شده در این بخش نمایش داده می‌شود.</p>
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
          <span className={styles.kicker}>در حال بارگذاری</span>
          <h1>در حال بارگذاری سفارش‌ها...</h1>
        </section>
      </main>
    );
  }

  if (orders.length === 0) {
    return (
      <main className={styles.wrapper}>
        <section className={styles.stateCard}>
          <span className={styles.kicker}>تاریخچه سفارش</span>
          <h1>هنوز سفارشی ثبت نکرده‌اید</h1>
          <p>بعد از خرید محصول، سفارش شما اینجا با وضعیت و جزئیات کامل نمایش داده می‌شود.</p>
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
          <p className={styles.kicker}>تاریخچه سفارش</p>
          <h1>سفارش‌های من</h1>
          <p>وضعیت خریدهای دیجیتال، آیتم‌ها و مبلغ هر سفارش را از اینجا دنبال کن.</p>
        </div>
        <div className={styles.heroStats}>
          <span>
            <strong>{orders.length}</strong>
            کل سفارش‌ها
          </span>
          <span>
            <strong>{stats.pending}</strong>
            در جریان
          </span>
          <span>
            <strong>{formatCurrency(stats.totalSpent)}</strong>
            مجموع خرید
          </span>
        </div>
      </section>

      <section className={styles.summaryStrip}>
        <div>
          <strong>{stats.completed}</strong>
          <span>سفارش تکمیل‌شده</span>
        </div>
        <div>
          <strong>{stats.pending}</strong>
          <span>منتظر پردازش</span>
        </div>
        <div>
          <strong>۲۴/۷</strong>
          <span>پیگیری و پشتیبانی</span>
        </div>
      </section>

      <section className={styles.ordersList}>
        {orders.map((order) => {
          const statusInfo = STATUS[order.status] || STATUS.pending;
          const activeStep = statusInfo.step;

          return (
            <article key={order.id} className={styles.orderCard}>
              <header className={styles.orderHeader}>
                <div>
                  <span className={styles.orderNumber}>سفارش #{order.id}</span>
                  <h2>{formatDate(order.created_at)}</h2>
                </div>
                <OrderStatus status={order.status} />
              </header>

              <div className={styles.timeline}>
                {STATUS_STEPS.map((step, index) => {
                  const done = activeStep >= index + 1;
                  return (
                    <div key={step} className={`${styles.timelineStep} ${done ? styles.done : ""}`}>
                      <span>{index + 1}</span>
                      <strong>{step}</strong>
                    </div>
                  );
                })}
              </div>

              <div className={styles.items}>
                {order.items.map((item) => (
                  <div key={item.id} className={styles.item}>
                    <div className={styles.itemMark}>کد</div>
                    <div className={styles.itemInfo}>
                      <strong>{item.variant.product_name || item.variant.name}</strong>
                      {item.variant.product_name && (
                        <span className={styles.itemVariant}>{item.variant.name}</span>
                      )}
                      <span>{item.quantity} عدد × {formatCurrency(item.price)}</span>
                    </div>
                    <em>{formatCurrency(item.subtotal)}</em>
                  </div>
                ))}
              </div>

              <footer className={styles.orderFooter}>
                <div>
                  <span>تحویل دیجیتال</span>
                  <strong>
                    {order.status === "completed"
                      ? "آماده پیگیری در حساب کاربری"
                      : "پس از تکمیل سفارش فعال می‌شود"}
                  </strong>
                </div>
                <div className={styles.total}>
                  <span>مجموع</span>
                  <strong>{formatCurrency(order.total_price)}</strong>
                </div>
              </footer>
            </article>
          );
        })}
      </section>
    </main>
  );
}
