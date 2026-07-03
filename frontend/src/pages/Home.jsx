import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import ProductCard from "../components/ProductCard";
import { ProductCardSkeleton } from "../components/Skeleton";
import { formatCurrency } from "../utils/formatters";
import styles from "./Home.module.css";

const CATEGORY_LABELS = {
  steam: "اس",
  "battle-net": "بت",
  "gift-cards": "گی",
  hearthstone: "ها",
  "call-of-duty": "کا",
  "mobile-games": "مو",
  "world-of-warcraft": "وا",
  default: "تم",
};

const TRUST_ITEMS = [
  { value: "آنی", label: "تحویل دیجیتال" },
  { value: "امن", label: "پرداخت و حساب کاربری" },
  { value: "۲۴/۷", label: "پشتیبانی فروشگاه" },
  { value: "اصل", label: "کد و محصول معتبر" },
];

const STEPS = [
  {
    number: "۰۱",
    title: "انتخاب محصول",
    text: "محصول، پلتفرم، منطقه و ظرفیت مورد نظر را با قیمت شفاف انتخاب کن.",
  },
  {
    number: "۰۲",
    title: "ثبت سفارش",
    text: "سبد خرید، کد تخفیف و موجودی محصول قبل از ثبت سفارش بررسی می‌شود.",
  },
  {
    number: "۰۳",
    title: "دریافت دیجیتال",
    text: "پس از تایید سفارش، اطلاعات خرید در حساب کاربری و سفارش‌ها ثبت می‌شود.",
  },
];

const getList = (data) => {
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data)) return data;
  return [];
};

const getTotal = (data, fallback) => (
  typeof data?.count === "number" ? data.count : fallback
);

const formatNumber = (value, fallback = "—") => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return new Intl.NumberFormat("fa-IR").format(numeric);
};

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [newest, setNewest] = useState([]);
  const [posts, setPosts] = useState([]);
  const [productTotal, setProductTotal] = useState(0);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingNewest, setLoadingNewest] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    api
      .get("/products/categories/")
      .then((res) => setCategories(getList(res.data)))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));

    api
      .get("/products/?featured=true&page_size=8")
      .then((res) => setFeatured(getList(res.data).slice(0, 8)))
      .catch(() => setFeatured([]))
      .finally(() => setLoadingFeatured(false));

    api
      .get("/products/?page_size=8")
      .then((res) => {
        const products = getList(res.data);
        setNewest(products.slice(0, 4));
        setProductTotal(getTotal(res.data, products.length));
      })
      .catch(() => {
        setNewest([]);
        setProductTotal(0);
      })
      .finally(() => setLoadingNewest(false));

    api
      .get("/blog/")
      .then((res) => setPosts(getList(res.data).slice(0, 3)))
      .catch(() => setPosts([]))
      .finally(() => setLoadingPosts(false));
  }, []);

  const heroProducts = useMemo(() => {
    const products = featured.length > 0 ? featured : newest;
    return products.slice(0, 5);
  }, [featured, newest]);

  useEffect(() => {
    if (heroProducts.length < 2) return undefined;

    const timer = window.setInterval(() => {
      setActiveHeroIndex((current) => (current + 1) % heroProducts.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [heroProducts.length]);

  const activeHeroProduct = heroProducts[activeHeroIndex % heroProducts.length];
  const heroProductUrl = activeHeroProduct ? `/products/${activeHeroProduct.slug}` : "/shop";
  const heroPrice = activeHeroProduct ? formatCurrency(activeHeroProduct.starting_price) : "نامشخص";

  return (
    <div className={styles.page}>
      <section
        className={styles.hero}
        style={activeHeroProduct?.image ? { "--hero-image": `url(${activeHeroProduct.image})` } : undefined}
      >
        <div className={styles.heroBackdrop} />
        <div className={styles.heroShade} />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              {activeHeroProduct?.category_name || "فروشگاه دیجیتال تمپوتمپو"}
            </p>
            <h1 className={styles.heroTitle}>
              {activeHeroProduct?.name || "خرید سریع و مطمئن محصولات دیجیتال بازی"}
            </h1>
            <p className={styles.heroText}>
              {activeHeroProduct
                ? `از ${heroPrice} شروع می‌شود؛ ظرفیت، منطقه و موجودی را در صفحه محصول بررسی کن و خرید را مستقیم ادامه بده.`
                : "گیفت کارت، گیم تایم و شارژ حساب‌های بازی را با موجودی کنترل‌شده، سفارش امن و تجربه‌ای روان تهیه کن."}
            </p>
            <div className={styles.heroActions}>
              <Link to={heroProductUrl} className={styles.primaryAction}>
                {activeHeroProduct ? "مشاهده محصول" : "ورود به فروشگاه"}
              </Link>
              <Link to="/shop?featured=true" className={styles.secondaryAction}>
                پیشنهادهای ویژه
              </Link>
            </div>
          </div>

          <div className={styles.heroAside}>
            <Link to={heroProductUrl} className={styles.heroShowcase}>
              <div className={styles.showcaseImageWrap}>
                {activeHeroProduct?.image ? (
                  <img
                    src={activeHeroProduct.image}
                    alt={activeHeroProduct.name}
                    className={styles.showcaseImage}
                  />
                ) : (
                  <div className={styles.showcasePlaceholder}>تمپوتمپو</div>
                )}
              </div>
              <div className={styles.showcaseBody}>
                <span>{activeHeroProduct?.category_name || "پیشنهاد فروشگاه"}</span>
                <strong>{activeHeroProduct?.name || "محصولات دیجیتال بازی"}</strong>
                <em>از {heroPrice}</em>
              </div>
            </Link>

            {heroProducts.length > 1 && (
              <div className={styles.heroControls} aria-label="محصولات برجسته">
                {heroProducts.map((product, index) => (
                  <button
                    key={product.id}
                    type="button"
                    className={`${styles.heroDot} ${index === activeHeroIndex ? styles.heroDotActive : ""}`}
                    aria-label={`نمایش ${product.name}`}
                    aria-pressed={index === activeHeroIndex}
                    onClick={() => setActiveHeroIndex(index)}
                  />
                ))}
              </div>
            )}

            <div className={styles.heroSummary} aria-label="خلاصه فروشگاه">
              <span className={styles.summaryLabel}>امروز در فروشگاه</span>
              <div className={styles.summaryRows}>
                <span>محصولات فعال</span>
                <strong>{formatNumber(productTotal || newest.length, "۱۹+")}</strong>
              </div>
              <div className={styles.summaryRows}>
                <span>دسته‌بندی‌ها</span>
                <strong>{formatNumber(categories.length, "۷+")}</strong>
              </div>
              <div className={styles.summaryRows}>
                <span>کد تخفیف دمو</span>
                <strong>DEMO10</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.trustStrip} aria-label="مزیت‌های فروشگاه">
        {TRUST_ITEMS.map((item) => (
          <div key={item.label} className={styles.trustItem}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>مسیرهای سریع</p>
            <h2 className={styles.sectionTitle}>از کجا شروع می‌کنی؟</h2>
          </div>
          <Link to="/shop" className={styles.textLink}>
            مشاهده همه محصولات
          </Link>
        </div>

        {loadingCategories ? (
          <div className={styles.categoryGrid}>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className={styles.categorySkeleton} />
            ))}
          </div>
        ) : (
          <div className={styles.categoryGrid}>
            {categories.slice(0, 8).map((cat) => (
              <Link
                key={cat.id}
                to={`/shop?category=${cat.slug}`}
                className={styles.categoryCard}
              >
                <span className={styles.categoryMark}>
                  {CATEGORY_LABELS[cat.slug] || CATEGORY_LABELS.default}
                </span>
                <span className={styles.categoryName}>{cat.name}</span>
                <span className={styles.categoryAction}>ورود</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className={styles.featureBand}>
        <div className={styles.featureCopy}>
          <p className={styles.sectionKicker}>پیشنهاد ویژه</p>
          <h2 className={styles.bandTitle}>محصولات پرتقاضا برای خرید سریع</h2>
          <p className={styles.bandText}>
            این بخش برای محصولاتی است که کاربر باید سریع قیمت، موجودی و نوع
            تحویل را ببیند و بدون سردرگمی وارد جزئیات خرید شود.
          </p>
          <Link to="/shop?featured=true" className={styles.bandAction}>
            دیدن پیشنهادها
          </Link>
        </div>

        <div className={styles.heroProductList}>
          {heroProducts.length > 0 ? (
            heroProducts.map((product) => (
              <Link
                to={`/products/${product.slug}`}
                key={product.id}
                className={styles.heroProduct}
              >
                <span>{product.category_name || "محصول دیجیتال"}</span>
                <strong>{product.name}</strong>
                <em>از {formatCurrency(product.starting_price)}</em>
              </Link>
            ))
          ) : (
            <div className={styles.emptyPanel}>محصولات ویژه پس از ثبت نمایش داده می‌شوند.</div>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>ویترین فروشگاه</p>
            <h2 className={styles.sectionTitle}>محصولات ویژه</h2>
          </div>
          <Link to="/shop" className={styles.textLink}>
            رفتن به فروشگاه
          </Link>
        </div>

        <div className={styles.productRail}>
          {loadingFeatured
            ? Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className={styles.railCard}>
                  <ProductCardSkeleton />
                </div>
              ))
            : featured.map((product) => (
                <div key={product.id} className={styles.railCard}>
                  <ProductCard product={product} />
                </div>
              ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>فرآیند خرید</p>
            <h2 className={styles.sectionTitle}>ساده، قابل پیگیری، مطمئن</h2>
          </div>
        </div>
        <div className={styles.stepsGrid}>
          {STEPS.map((step) => (
            <article key={step.number} className={styles.stepCard}>
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>تازه‌ها</p>
            <h2 className={styles.sectionTitle}>جدیدترین محصولات</h2>
          </div>
          <Link to="/shop" className={styles.textLink}>
            همه تازه‌ها
          </Link>
        </div>

        {loadingNewest ? (
          <div className={styles.productsGrid}>
            {Array.from({ length: 4 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className={styles.productsGrid}>
            {newest.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {!loadingPosts && posts.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionKicker}>مجله خرید</p>
              <h2 className={styles.sectionTitle}>راهنماها و مقاله‌ها</h2>
            </div>
            <Link to="/blog" className={styles.textLink}>
              همه مقاله‌ها
            </Link>
          </div>
          <div className={styles.blogGrid}>
            {posts.map((post) => (
              <Link to={`/blog/${post.slug}`} key={post.id} className={styles.blogCard}>
                <div
                  className={styles.blogImage}
                  style={post.image ? { backgroundImage: `url(${post.image})` } : undefined}
                />
                <div className={styles.blogBody}>
                  <span>{new Date(post.created_at).toLocaleDateString("fa-IR")}</span>
                  <h3>{post.title}</h3>
                  {post.excerpt && <p>{post.excerpt}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className={styles.finalCta}>
        <div>
          <p className={styles.sectionKicker}>آماده خریدی؟</p>
          <h2>فروشگاه را با یک حساب رایگان شروع کن</h2>
        </div>
        <div className={styles.finalActions}>
          <Link to="/register" className={styles.primaryAction}>
            ساخت حساب
          </Link>
          <Link to="/shop" className={styles.secondaryAction}>
            ادامه بدون ثبت‌نام
          </Link>
        </div>
      </section>
    </div>
  );
}
