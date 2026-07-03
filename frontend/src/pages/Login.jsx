import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import styles from "./Login.module.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate("/");
    } catch {
      setError("ایمیل یا رمز عبور اشتباه است.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.wrapper}>
      <section className={styles.authShell}>
        <aside className={styles.infoPanel}>
          <span className={styles.kicker}>حساب تمپوتمپو</span>
          <h1>به حساب خرید دیجیتال خود برگردید</h1>
          <p>
            سفارش‌ها، سبد خرید، علاقه‌مندی‌ها و وضعیت خریدهای دیجیتال شما در
            حساب کاربری نگهداری می‌شود.
          </p>
          <div className={styles.infoGrid}>
            <div>
              <strong>امن</strong>
              <span>ورود با توکن امن</span>
            </div>
            <div>
              <strong>سریع</strong>
              <span>ادامه خرید از سبد</span>
            </div>
            <div>
              <strong>قابل پیگیری</strong>
              <span>مشاهده سفارش‌ها</span>
            </div>
          </div>
        </aside>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.kicker}>ورود</span>
            <h2>ورود به حساب</h2>
            <p>برای ادامه خرید، ایمیل و رمز عبور خود را وارد کنید.</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            {error && <div className={styles.error}>{error}</div>}

            <label className={styles.field}>
              <span>ایمیل</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                dir="ltr"
                required
              />
            </label>

            <label className={styles.field}>
              <span>رمز عبور</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="حداقل ۸ کاراکتر"
                required
              />
            </label>

            <button className={styles.submitBtn} type="submit" disabled={loading}>
              {loading ? "در حال ورود..." : "ورود"}
            </button>
          </form>

          <p className={styles.footer}>
            حساب ندارید؟
            <Link to="/register">ثبت‌نام کنید</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
