import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import useAuthStore from "../store/useAuthStore";
import useToastStore from "../store/useToastStore";
import styles from "./Profile.module.css";

export default function Profile() {
  const { user, fetchUser, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);

  const [form, setForm] = useState({ username: null, phone: null });
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({
    old_password: "",
    new_password: "",
    confirm: "",
  });
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
  }, [isAuthenticated, navigate]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = new FormData();
      data.append("username", form.username ?? user.username ?? "");
      data.append("phone", form.phone ?? user.phone ?? "");
      if (avatar) data.append("avatar", avatar);
      await api.patch("/auth/me/", data);
      await fetchUser();
      addToast("اطلاعات حساب با موفقیت ذخیره شد.", "success");
    } catch (err) {
      const d = err.response?.data;
      const first = d ? Object.values(d)[0] : null;
      addToast(
        Array.isArray(first) ? first[0] : first || "خطایی در ذخیره اطلاعات رخ داد.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) {
      addToast("رمز عبور جدید با تکرار آن مطابقت ندارد.", "error");
      return;
    }
    if (pwForm.new_password.length < 8) {
      addToast("رمز عبور جدید باید حداقل ۸ کاراکتر باشد.", "error");
      return;
    }
    setPwSaving(true);
    try {
      await api.post("/auth/change-password/", {
        old_password: pwForm.old_password,
        new_password: pwForm.new_password,
      });
      addToast("رمز عبور با موفقیت تغییر کرد.", "success");
      setPwForm({ old_password: "", new_password: "", confirm: "" });
    } catch (err) {
      const d = err.response?.data;
      addToast(d?.old_password?.[0] || d?.detail || "خطایی رخ داد.", "error");
    } finally {
      setPwSaving(false);
    }
  };

  if (!user) return null;

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>حساب کاربری</span>
          <h1>پروفایل من</h1>
          <p>اطلاعات شخصی، تصویر پروفایل و رمز عبور خود را مدیریت کنید.</p>
        </div>
        <div className={styles.accountCard}>
          <span>ایمیل حساب</span>
          <strong dir="ltr">{user.email}</strong>
        </div>
      </header>

      <div className={styles.grid}>
        <form onSubmit={handleSave} className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>اطلاعات شخصی</h2>
            <p>برای تحویل سفارش‌ها، اطلاعات تماس خود را به‌روز نگه دارید.</p>
          </div>

          <div className={styles.avatarRow}>
            <div className={styles.avatar}>
              {preview || user.avatar ? (
                <img src={preview || user.avatar} alt="تصویر پروفایل" />
              ) : (
                <span>👤</span>
              )}
            </div>
            <div className={styles.avatarActions}>
              <label className={styles.fileButton}>
                تغییر تصویر
                <input type="file" accept="image/*" onChange={handleAvatarChange} />
              </label>
              <small>تصویر با حجم مناسب برای نمایش سریع‌تر انتخاب کنید.</small>
            </div>
          </div>

          <div className={styles.fields}>
            <label>
              <span>نام کاربری</span>
              <input
                value={form.username ?? user.username ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                placeholder="نام کاربری"
              />
            </label>
            <label>
              <span>شماره تلفن</span>
              <input
                value={form.phone ?? user.phone ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="09xxxxxxxxx"
                dir="ltr"
              />
            </label>
            <label className={styles.full}>
              <span>ایمیل</span>
              <input value={user.email} disabled dir="ltr" />
              <small>ایمیل حساب برای امنیت قابل تغییر نیست.</small>
            </label>
          </div>

          <button className={styles.primaryButton} disabled={saving}>
            {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </button>
        </form>

        <form onSubmit={handlePasswordChange} className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>تغییر رمز عبور</h2>
            <p>برای امنیت بیشتر، از رمز عبور طولانی و غیرتکراری استفاده کنید.</p>
          </div>

          <div className={styles.fields}>
            {[
              { label: "رمز عبور فعلی", key: "old_password" },
              { label: "رمز عبور جدید", key: "new_password" },
              { label: "تکرار رمز عبور جدید", key: "confirm" },
            ].map(({ label, key }) => (
              <label key={key} className={styles.full}>
                <span>{label}</span>
                <input
                  type="password"
                  value={pwForm[key]}
                  onChange={(e) => setPwForm((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder="••••••••"
                />
              </label>
            ))}
          </div>

          <button className={styles.secondaryButton} disabled={pwSaving}>
            {pwSaving ? "در حال تغییر..." : "تغییر رمز عبور"}
          </button>
        </form>
      </div>
    </section>
  );
}
