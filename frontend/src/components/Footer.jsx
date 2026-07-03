import { Link } from "react-router-dom";
import styles from "./Footer.module.css";

const FOOTER_LINKS = [
  {
    title: "فروشگاه",
    links: [
      { label: "همه محصولات", to: "/shop" },
      { label: "وارکرفت", to: "/shop?category=world-of-warcraft" },
      { label: "استیم", to: "/shop?category=steam" },
      { label: "بتل‌نت", to: "/shop?category=battle-net" },
    ],
  },
  {
    title: "حساب کاربری",
    links: [
      { label: "ورود", to: "/login" },
      { label: "ثبت‌نام", to: "/register" },
      { label: "سفارش‌ها", to: "/orders" },
      { label: "سبد خرید", to: "/cart" },
    ],
  },
  {
    title: "محتوا",
    links: [
      { label: "بلاگ", to: "/blog" },
      { label: "علاقه‌مندی‌ها", to: "/wishlist" },
      { label: "پروفایل", to: "/profile" },
      { label: "داشبورد", to: "/admin-dashboard" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Link to="/" className={styles.logo}>
              تمپوتمپو
            </Link>
            <p>
              مرجع خرید محصولات دیجیتال بازی، گیفت کارت و اشتراک با تجربه‌ای سریع،
              شفاف و قابل پیگیری.
            </p>
            <div className={styles.badges}>
              <span>تحویل سریع</span>
              <span>پرداخت امن</span>
              <span>پشتیبانی سفارش</span>
            </div>
          </div>

          {FOOTER_LINKS.map((group) => (
            <div className={styles.column} key={group.title}>
              <h2>{group.title}</h2>
              {group.links.map((link) => (
                <Link key={link.label} to={link.to}>
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className={styles.bottom}>
          <p>© ۱۴۰۵ تمپوتمپو - تمام حقوق محفوظ است.</p>
          <p>پروژه کارشناسی مهندسی نرم‌افزار</p>
        </div>
      </div>
    </footer>
  );
}
