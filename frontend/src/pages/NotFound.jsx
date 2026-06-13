import { Link } from "react-router-dom";
import styles from "./NotFound.module.css";

export default function NotFound() {
  return (
    <section className={styles.page}>
      <div className={styles.code}>404</div>
      <h1>صفحه پیدا نشد</h1>
      <p>آدرسی که وارد کرده‌اید وجود ندارد یا از سایت حذف شده است.</p>
      <div className={styles.actions}>
        <Link className={styles.primary} to="/">
          بازگشت به خانه
        </Link>
        <Link className={styles.secondary} to="/shop">
          مشاهده فروشگاه
        </Link>
      </div>
    </section>
  );
}
