import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import useAuthStore from "../store/useAuthStore";
import { formatCurrency, formatNumber } from "../utils/formatters";
import styles from "./AdminDashboard.module.css";

const STATUS_MAP = {
  pending: { label: "در انتظار", color: "#f59e0b", tone: "warning" },
  processing: { label: "در حال پردازش", color: "#3b82f6", tone: "info" },
  completed: { label: "تکمیل شده", color: "#22c55e", tone: "success" },
  cancelled: { label: "لغو شده", color: "#ef4444", tone: "danger" },
};

function RevenueChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className={styles.emptyChart}>
        هنوز سفارش تکمیل‌شده‌ای برای نمایش درآمد وجود ندارد.
      </div>
    );
  }

  const max = Math.max(...data.map((item) => item.revenue), 1);

  return (
    <div className={styles.chart}>
      <div className={styles.chartBars}>
        {data.map((item) => (
          <div key={item.month} className={styles.chartColumn}>
            <span>{formatCurrency(item.revenue)}</span>
            <div
              className={styles.chartBar}
              style={{ height: `${Math.max((item.revenue / max) * 150, 8)}px` }}
            />
          </div>
        ))}
      </div>
      <div className={styles.chartLabels}>
        {data.map((item) => (
          <span key={item.month}>{item.month}</span>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (user && !user.is_staff) navigate("/");
  }, [user, navigate]);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          api.get("/admin/stats/"),
          api.get("/admin/orders/"),
        ]);
        setStats(statsRes.data);
        setOrders(ordersRes.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await api.patch(`/admin/orders/${orderId}/`, { status: newStatus });
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order,
        ),
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const dashboardStats = useMemo(() => {
    if (!stats) return [];
    return [
      {
        label: "درآمد تکمیل‌شده",
        value: formatCurrency(stats.total_revenue),
        helper: "فقط سفارش‌های تکمیل‌شده",
      },
      {
        label: "کل سفارش‌ها",
        value: formatNumber(stats.total_orders),
        helper: "تمام وضعیت‌ها",
      },
      {
        label: "کاربران",
        value: formatNumber(stats.total_users),
        helper: "حساب‌های ثبت‌شده",
      },
      {
        label: "محصولات فعال",
        value: formatNumber(stats.total_products),
        helper: "قابل نمایش در فروشگاه",
      },
      {
        label: "میانگین سفارش",
        value: formatCurrency(stats.average_order_value),
        helper: "میانگین سفارش‌های تکمیل‌شده",
      },
      {
        label: "سفارش‌های در جریان",
        value: formatNumber(stats.pending_orders),
        helper: "در انتظار یا در حال پردازش",
      },
      {
        label: "گونه‌های کم‌موجودی",
        value: formatNumber(stats.low_stock_variants),
        helper: "موجودی ۵ عدد یا کمتر",
      },
      {
        label: "مقاله‌های منتشرشده",
        value: formatNumber(stats.total_blog_posts),
        helper: "محتوای فعال بلاگ",
      },
    ];
  }, [stats]);

  if (loading) {
    return (
      <main className={styles.wrapper}>
        <section className={styles.stateCard}>
          <span className={styles.kicker}>مدیریت</span>
          <h1>در حال بارگذاری داشبورد...</h1>
        </section>
      </main>
    );
  }

  if (!stats) {
    return (
      <main className={styles.wrapper}>
        <section className={styles.stateCard}>
          <span className={styles.kicker}>مدیریت</span>
          <h1>دریافت اطلاعات داشبورد ممکن نیست</h1>
          <p>لطفاً وضعیت ورود مدیر و اتصال API را بررسی کنید.</p>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.wrapper}>
      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>پنل مدیریت</p>
          <h1>داشبورد مدیریت تمپوتمپو</h1>
          <p>
            نمای مدیریتی فروشگاه برای بررسی درآمد، سفارش‌ها، کاربران، محصولات و
            تغییر وضعیت سفارش‌ها.
          </p>
        </div>
        <div className={styles.heroPanel}>
          <span>آخرین سفارش‌ها</span>
          <strong>{orders.length}</strong>
          <em>نمایش ۵۰ سفارش اخیر</em>
        </div>
      </section>

      <section className={styles.kpiGrid}>
        {dashboardStats.map((card) => (
          <article key={card.label} className={styles.kpiCard}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.helper}</p>
          </article>
        ))}
      </section>

      <section className={styles.analyticsGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.kicker}>درآمد</span>
              <h2>درآمد ماهانه</h2>
            </div>
          </div>
          <RevenueChart data={stats.monthly_revenue} />
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.kicker}>سفارش‌ها</span>
              <h2>وضعیت سفارش‌ها</h2>
            </div>
          </div>
          <div className={styles.statusList}>
            {Object.entries(stats.orders_by_status).map(([status, count]) => {
              const statusInfo = STATUS_MAP[status] || STATUS_MAP.pending;
              const total = stats.total_orders || 1;
              const percent = Math.round((count / total) * 100);

              return (
                <div key={status} className={styles.statusRow}>
                  <div>
                    <span style={{ color: statusInfo.color }}>{statusInfo.label}</span>
                    <strong>{count}</strong>
                  </div>
                  <div className={styles.statusTrack}>
                    <span
                      style={{
                        width: `${percent}%`,
                        background: statusInfo.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className={styles.ordersPanel}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.kicker}>مدیریت</span>
            <h2>آخرین سفارش‌ها</h2>
          </div>
          <p>تغییر وضعیت سفارش از همین جدول انجام می‌شود.</p>
        </div>

        {orders.length === 0 ? (
          <div className={styles.emptyTable}>هنوز سفارشی ثبت نشده است.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.ordersTable}>
              <thead>
                <tr>
                  <th>شناسه</th>
                  <th>کاربر</th>
                  <th>مبلغ</th>
                  <th>آیتم‌ها</th>
                  <th>تاریخ</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.pending;
                  return (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{order.user_email}</td>
                      <td>{formatCurrency(order.total_price)}</td>
                      <td>{order.items_count} آیتم</td>
                      <td>{order.created_at}</td>
                      <td>
                        <span className={`${styles.badge} ${styles[statusInfo.tone]}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td>
                        <select
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        >
                          {Object.entries(STATUS_MAP).map(([value, { label }]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
