import { Link } from "react-router-dom";
import useWishlistStore from "../store/useWishlistStore";
import useAuthStore from "../store/useAuthStore";
import styles from "./ProductCard.module.css";

export default function ProductCard({ product }) {
  const { isAuthenticated } = useAuthStore();
  const { toggle, isWishlisted } = useWishlistStore();
  const wishlisted = isWishlisted(product.id);

  const handleWishlist = (e) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    toggle(product.id);
  };

  return (
    <Link to={`/products/${product.slug}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className={styles.image}
          />
        ) : (
          <div className={styles.placeholder}>🎮</div>
        )}
        {isAuthenticated && (
          <button
            onClick={handleWishlist}
            className={`${styles.heartBtn} ${wishlisted ? styles.heartActive : ""}`}
          >
            {wishlisted ? "❤️" : "🤍"}
          </button>
        )}
      </div>
      <div className={styles.body}>
        <span className={styles.category}>{product.category_name}</span>
        <h3 className={styles.name}>{product.name}</h3>
        <div className={styles.footer}>
          <div className={styles.price}>
            <span className={styles.priceLabel}>از</span>
            <span className={styles.priceValue}>${product.starting_price}</span>
          </div>
          <span className={styles.viewBtn}>مشاهده ←</span>
        </div>
      </div>
    </Link>
  );
}
