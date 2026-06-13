import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import useAuthStore from "../store/useAuthStore";
import useCartStore from "../store/useCartStore";
import useWishlistStore from "../store/useWishlistStore";
import useToastStore from "../store/useToastStore";
import ProductCard from "../components/ProductCard";
import styles from "./ProductDetail.module.css";

const ACTIVATION_STEPS = [
  {
    step: "۰۱",
    title: "ثبت سفارش",
    desc: "نوع محصول را انتخاب کن و سفارش را از سبد خرید نهایی کن.",
  },
  {
    step: "۰۲",
    title: "بررسی موجودی",
    desc: "سیستم موجودی و اعتبار سفارش را قبل از ثبت نهایی کنترل می‌کند.",
  },
  {
    step: "۰۳",
    title: "تحویل دیجیتال",
    desc: "اطلاعات سفارش در حساب کاربری و بخش سفارش‌ها قابل پیگیری است.",
  },
  {
    step: "۰۴",
    title: "پشتیبانی",
    desc: "در صورت مشکل، وضعیت سفارش و جزئیات خرید قابل بررسی است.",
  },
];

const TABS = [
  { key: "description", label: "توضیحات" },
  { key: "activation", label: "فرآیند فعال‌سازی" },
  { key: "reviews", label: "نظرات" },
];

const RATING_LABELS = ["", "خیلی بد", "بد", "متوسط", "خوب", "عالی"];

function Stars({ value = 0, size = "sm" }) {
  return (
    <span className={`${styles.stars} ${size === "lg" ? styles.starsLarge : ""}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= Math.round(value) ? styles.starOn : ""}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { addToCart } = useCartStore();
  const { toggle, isWishlisted } = useWishlistStore();
  const addToast = useToastStore((s) => s.addToast);

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ count: 0, average: null });
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/products/${slug}/`);
        setProduct(res.data);
        const first = res.data.variants.find((v) => v.is_active && v.stock > 0);
        setSelectedVariant(first || null);

        const rel = await api.get(`/products/?category=${res.data.category.slug}`);
        setRelated(
          (rel.data.results || rel.data)
            .filter((p) => p.slug !== slug)
            .slice(0, 4),
        );

        const reviewRes = await api.get(`/reviews/${res.data.id}/`);
        setReviews(reviewRes.data.reviews);
        setReviewStats({
          count: reviewRes.data.count,
          average: reviewRes.data.average,
        });
      } catch {
        navigate("/shop");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, navigate]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!selectedVariant) return;
    setAdding(true);
    try {
      await addToCart(selectedVariant.id, 1);
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    toggle(product.id);
  };

  const handleReviewSubmit = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!reviewForm.rating) {
      addToast("لطفاً امتیاز را انتخاب کنید", "error");
      return;
    }
    setSubmittingReview(true);
    try {
      await api.post(`/reviews/${product.id}/`, reviewForm);
      addToast("نظر شما با موفقیت ثبت شد", "success");
      const res = await api.get(`/reviews/${product.id}/`);
      setReviews(res.data.reviews);
      setReviewStats({ count: res.data.count, average: res.data.average });
      setReviewForm({ rating: 0, comment: "" });
    } catch (err) {
      addToast(err.response?.data?.error || "خطایی رخ داد", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.loadingCard}>در حال بارگذاری محصول...</div>
      </div>
    );
  }
  if (!product) return null;

  const activeVariants = product.variants.filter((v) => v.is_active);
  const inStock = selectedVariant?.stock > 0;
  const wishlisted = isWishlisted(product.id);
  const average = reviewStats.average || 0;

  const metaRows = [
    { label: "پلتفرم", value: product.platform || "ثبت نشده" },
    { label: "منطقه", value: product.region || "گلوبال" },
    { label: "نوع تحویل", value: product.delivery_type || "کد دیجیتال فوری" },
    { label: "دسته‌بندی", value: product.category.name },
  ];

  return (
    <div className={styles.wrapper}>
      <nav className={styles.breadcrumb} aria-label="مسیر محصول">
        <Link to="/">خانه</Link>
        <span>›</span>
        <Link to="/shop">فروشگاه</Link>
        <span>›</span>
        <Link to={`/shop?category=${product.category.slug}`}>{product.category.name}</Link>
        <span>›</span>
        <em>{product.name}</em>
      </nav>

      <section className={styles.hero}>
        <div className={styles.visualPanel}>
          <div className={styles.imageFrame}>
            {product.image ? (
              <img src={product.image} alt={product.name} />
            ) : (
              <div className={styles.placeholder}>TT</div>
            )}
          </div>
          <div className={styles.visualStats}>
            <span>
              <strong>{activeVariants.length}</strong>
              نوع فعال
            </span>
            <span>
              <strong>{reviewStats.count}</strong>
              نظر ثبت‌شده
            </span>
          </div>
        </div>

        <div className={styles.productIntro}>
          <span className={styles.categoryTag}>{product.category.name}</span>
          <h1>{product.name}</h1>
          <div className={styles.ratingLine}>
            <Stars value={average} />
            <span>
              {reviewStats.count > 0
                ? `${average} از ۵ بر اساس ${reviewStats.count} نظر`
                : "هنوز نظری ثبت نشده"}
            </span>
          </div>
          <p>
            {product.short_description ||
              "محصول دیجیتال قابل خرید از فروشگاه TempoTempo با اطلاعات پلتفرم، منطقه و موجودی مشخص."}
          </p>

          <div className={styles.metaGrid}>
            {metaRows.map((row) => (
              <div key={row.label} className={styles.metaItem}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <aside className={styles.buyCard}>
          <div className={styles.buyHeader}>
            <span>انتخاب و خرید</span>
            <strong>{selectedVariant ? `$${selectedVariant.price}` : "انتخاب نوع"}</strong>
          </div>

          <div className={styles.variantSection}>
            <label>نوع محصول</label>
            <div className={styles.variantGrid}>
              {activeVariants.map((variant) => (
                <button
                  key={variant.id}
                  className={`${styles.variantBtn} ${
                    selectedVariant?.id === variant.id ? styles.variantActive : ""
                  } ${variant.stock === 0 ? styles.variantDisabled : ""}`}
                  onClick={() => setSelectedVariant(variant)}
                >
                  <strong>{variant.name}</strong>
                  <span>${variant.price}</span>
                  <em>{variant.stock > 0 ? `${variant.stock} موجود` : "ناموجود"}</em>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.stockLine}>
            <span className={inStock ? styles.stockOk : styles.stockBad} />
            {selectedVariant
              ? inStock
                ? `${selectedVariant.stock} عدد آماده سفارش`
                : "این نوع فعلاً ناموجود است"
              : "یک نوع محصول انتخاب کنید"}
          </div>

          <button
            className={styles.addBtn}
            onClick={handleAddToCart}
            disabled={adding || !selectedVariant || !inStock}
          >
            {adding
              ? "در حال افزودن..."
              : !selectedVariant
                ? "یک نوع انتخاب کنید"
                : !inStock
                  ? "ناموجود"
                  : "افزودن به سبد خرید"}
          </button>

          <button className={styles.wishlistBtn} onClick={handleWishlist}>
            {wishlisted ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
          </button>

          {!isAuthenticated && (
            <p className={styles.loginNote}>
              برای خرید باید <Link to="/login">وارد حساب شوید</Link>.
            </p>
          )}
        </aside>
      </section>

      <section className={styles.trustBand}>
        <div>
          <strong>تحویل دیجیتال</strong>
          <span>ثبت سفارش و پیگیری از حساب کاربری</span>
        </div>
        <div>
          <strong>کنترل موجودی</strong>
          <span>جلوگیری از خرید بیش از ظرفیت محصول</span>
        </div>
        <div>
          <strong>خریدار تاییدشده</strong>
          <span>ثبت نظر فقط پس از سفارش تکمیل‌شده</span>
        </div>
      </section>

      <section className={styles.tabs}>
        <div className={styles.tabHeaders}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {tab.key === "reviews" && reviewStats.count > 0 && <span>{reviewStats.count}</span>}
            </button>
          ))}
        </div>

        <div className={styles.tabBody}>
          {activeTab === "description" && (
            <article className={styles.description}>
              <h2>درباره این محصول</h2>
              <p>{product.description || "توضیحاتی برای این محصول ثبت نشده است."}</p>
            </article>
          )}

          {activeTab === "activation" && (
            <div className={styles.stepsGrid}>
              {ACTIVATION_STEPS.map((step) => (
                <article key={step.step} className={styles.stepCard}>
                  <span>{step.step}</span>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </article>
              ))}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className={styles.reviewLayout}>
              <aside className={styles.reviewSummary}>
                <strong>{average || "—"}</strong>
                <Stars value={average} size="lg" />
                <span>{reviewStats.count} نظر کاربران</span>
              </aside>

              <div className={styles.reviewMain}>
                {isAuthenticated && (
                  <div className={styles.reviewForm}>
                    <h3>نظر خود را ثبت کنید</h3>
                    <div className={styles.ratingPicker}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setReviewForm((p) => ({ ...p, rating: star }))}
                          onMouseEnter={() => setHoveredStar(star)}
                          onMouseLeave={() => setHoveredStar(0)}
                          className={
                            star <= (hoveredStar || reviewForm.rating) ? styles.ratingActive : ""
                          }
                        >
                          ★
                        </button>
                      ))}
                      {reviewForm.rating > 0 && <span>{RATING_LABELS[reviewForm.rating]}</span>}
                    </div>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) =>
                        setReviewForm((p) => ({ ...p, comment: e.target.value }))
                      }
                      placeholder="نظر خود را بنویسید... (اختیاری)"
                      rows={4}
                    />
                    <button onClick={handleReviewSubmit} disabled={submittingReview}>
                      {submittingReview ? "در حال ثبت..." : "ثبت نظر"}
                    </button>
                  </div>
                )}

                {reviews.length === 0 ? (
                  <div className={styles.emptyReviews}>
                    <strong>هنوز نظری ثبت نشده</strong>
                    <p>پس از خرید و تکمیل سفارش، امکان ثبت نظر برای این محصول فعال می‌شود.</p>
                  </div>
                ) : (
                  <div className={styles.reviewList}>
                    {reviews.map((review) => (
                      <article key={review.id} className={styles.reviewCard}>
                        <div className={styles.reviewHead}>
                          <div>
                            <strong>{review.user}</strong>
                            <span>{review.created_at}</span>
                          </div>
                          <Stars value={review.rating} />
                        </div>
                        {review.comment && <p>{review.comment}</p>}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className={styles.relatedSection}>
          <div className={styles.sectionHeader}>
            <div>
              <span>پیشنهادهای مشابه</span>
              <h2>محصولات مرتبط</h2>
            </div>
            <Link to={`/shop?category=${product.category.slug}`}>دیدن دسته‌بندی</Link>
          </div>
          <div className={styles.relatedGrid}>
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
