import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import useCartStore from "../store/useCartStore";
import useWishlistStore from "../store/useWishlistStore";
import styles from "./Navbar.module.css";

const MAIN_LINKS = [
  { to: "/", label: "خانه" },
  { to: "/shop", label: "فروشگاه" },
  { to: "/blog", label: "بلاگ" },
];

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuthStore();
  const { itemCount, fetchCart } = useCartStore();
  const { fetchWishlist } = useWishlistStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
      fetchWishlist();
    }
  }, [isAuthenticated, fetchCart, fetchWishlist]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/");
  };

  const accountLinks = [
    { to: "/wishlist", label: "علاقه‌مندی‌ها" },
    { to: "/orders", label: "سفارش‌ها" },
    { to: "/profile", label: "پروفایل" },
  ];

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.container}>
          <Link to="/" className={styles.logo}>
            TempoTempo
          </Link>

          <div className={styles.links}>
            {MAIN_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className={styles.link}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className={styles.actions}>
            <Link to="/cart" className={styles.cartBtn} aria-label="سبد خرید">
              سبد
              {itemCount > 0 && <span className={styles.badge}>{itemCount}</span>}
            </Link>

            {isAuthenticated ? (
              <>
                {user?.is_staff && (
                  <Link to="/admin-dashboard" className={styles.adminBtn}>
                    داشبورد
                  </Link>
                )}
                {accountLinks.map((link) => (
                  <Link key={link.to} to={link.to} className={styles.accountLink}>
                    {link.label}
                  </Link>
                ))}
                <button onClick={handleLogout} className={styles.logoutBtn}>
                  خروج
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={styles.loginBtn}>
                  ورود
                </Link>
                <Link to="/register" className={styles.registerBtn}>
                  ثبت‌نام
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ""}`}
            aria-label="باز کردن منو"
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      <button
        className={`${styles.overlay} ${menuOpen ? styles.overlayOpen : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-label="بستن منو"
      />

      <aside className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ""}`}>
        {[...MAIN_LINKS, { to: "/cart", label: `سبد خرید${itemCount ? ` (${itemCount})` : ""}` }].map(
          (item) => (
            <Link
              key={item.to}
              to={item.to}
              className={styles.mobileLink}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ),
        )}

        {isAuthenticated && (
          <>
            <div className={styles.mobileDivider} />
            {accountLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={styles.mobileLink}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
            ))}
            {user?.is_staff && (
              <Link
                to="/admin-dashboard"
                className={styles.mobileAdmin}
                onClick={() => setMenuOpen(false)}
              >
                داشبورد مدیریت
              </Link>
            )}
          </>
        )}

        <div className={styles.mobileAuth}>
          {isAuthenticated ? (
            <button onClick={handleLogout} className={styles.mobileButton}>
              خروج از حساب
            </button>
          ) : (
            <>
              <Link to="/login" className={styles.mobileButton} onClick={() => setMenuOpen(false)}>
                ورود
              </Link>
              <Link
                to="/register"
                className={styles.mobilePrimary}
                onClick={() => setMenuOpen(false)}
              >
                ثبت‌نام رایگان
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
