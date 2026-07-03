import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import useAuthStore from "../store/useAuthStore";
import styles from "./Register.module.css";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register/", {
        ...form,
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      await login(form.email.trim(), form.password);
      navigate("/");
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const first = Object.values(data)[0];
        setError(Array.isArray(first) ? first[0] : first);
      } else {
        setError("خطایی رخ داد. لطفاً دوباره امتحان کنید.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.wrapper}>
      <section className={styles.authShell}>
        <aside className={styles.infoPanel}>
          <span className={styles.kicker}>مشتری جدید</span>
          <h1>حساب بسازید و خرید دیجیتال را مدیریت کنید</h1>
          <p>
            با ساخت حساب، سبد خرید، سفارش‌ها، علاقه‌مندی‌ها و امکان ثبت نظر پس
            از خرید برای شما فعال می‌شود.
          </p>
          <div className={styles.infoGrid}>
            <div>
              <strong>سبد خرید</strong>
              <span>ذخیره آیتم‌های انتخابی</span>
            </div>
            <div>
              <strong>سفارش‌ها</strong>
              <span>پیگیری وضعیت خرید</span>
            </div>
            <div>
              <strong>نظرات</strong>
              <span>ثبت تجربه پس از خرید</span>
            </div>
          </div>
        </aside>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.kicker}>ثبت‌نام</span>
            <h2>ایجاد حساب</h2>
            <p>اطلاعات اولیه را وارد کنید تا حساب تمپوتمپو شما ساخته شود.</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            {error && <div className={styles.error}>{error}</div>}

            <label className={styles.field}>
              <span>نام کاربری</span>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="نام کاربری"
                dir="ltr"
                required
              />
            </label>

            <label className={styles.field}>
              <span>ایمیل</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="example@email.com"
                dir="ltr"
                required
              />
            </label>

            <label className={styles.field}>
              <span>شماره تلفن <em>اختیاری</em></span>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="09xxxxxxxxx"
                dir="ltr"
              />
            </label>

            <label className={styles.field}>
              <span>رمز عبور</span>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="حداقل ۸ کاراکتر"
                minLength={8}
                required
              />
              <small>رمز عبور باید حداقل ۸ کاراکتر داشته باشد.</small>
            </label>

            <button className={styles.submitBtn} type="submit" disabled={loading}>
              {loading ? "در حال ثبت‌نام..." : "ساخت حساب"}
            </button>
          </form>

          <p className={styles.footer}>
            قبلاً ثبت‌نام کرده‌اید؟
            <Link to="/login">وارد شوید</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
