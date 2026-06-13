import { useEffect } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import useAuthStore from "../store/useAuthStore";
import useWishlistStore from "../store/useWishlistStore";
import styles from "./Wishlist.module.css";

export default function Wishlist() {
  const { isAuthenticated } = useAuthStore();
  const { items, fetchWishlist } = useWishlistStore();

  useEffect(() => {
    if (isAuthenticated) fetchWishlist();
  }, [isAuthenticated, fetchWishlist]);

  if (!isAuthenticated) {
    return (
      <section className={styles.authState}>
        <div className={styles.emptyIcon}>♡</div>
        <h1>برای دیدن علاقه‌مندی‌ها وارد شوید</h1>
        <p>بعد از ورود، محصولاتی که ذخیره کرده‌اید اینجا نمایش داده می‌شوند.</p>
        <Link to="/login">ورود به حساب</Link>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>لیست شخصی</span>
          <h1>علاقه‌مندی‌های من</h1>
          <p>محصولات ذخیره‌شده برای خرید سریع‌تر و مقایسه راحت‌تر.</p>
        </div>
        <div className={styles.countBox}>
          <strong>{items.length}</strong>
          <span>محصول ذخیره‌شده</span>
        </div>
      </header>

      {items.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>♡</div>
          <h2>هنوز محصولی ذخیره نکرده‌اید</h2>
          <p>در فروشگاه بگردید و آیتم‌های مهم را به علاقه‌مندی‌ها اضافه کنید.</p>
          <Link to="/shop">مشاهده فروشگاه</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
