import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import ProductCard from "../components/ProductCard";
import { ProductCardSkeleton } from "../components/Skeleton";
import heroArt from "../assets/hero.png";
import styles from "./Home.module.css";

const CATEGORY_LABELS = {
  steam: "ST",
  "battle-net": "BN",
  "gift-cards": "GC",
  hearthstone: "HS",
  "call-of-duty": "CD",
  "mobile-games": "MG",
  "world-of-warcraft": "WW",
  default: "TT",
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

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [newest, setNewest] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingNewest, setLoadingNewest] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    api
      .get("/products/categories/")
      .then((res) => setCategories(res.data.results || res.data))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));

    api
      .get("/products/?featured=true")
      .then((res) => setFeatured((res.data.results || res.data).slice(0, 6)))
      .catch(() => setFeatured([]))
      .finally(() => setLoadingFeatured(false));

    api
      .get("/products/")
      .then((res) => setNewest((res.data.results || res.data).slice(0, 4)))
      .catch(() => setNewest([]))
      .finally(() => setLoadingNewest(false));

    api
      .get("/blog/")
      .then((res) => setPosts((res.data.results || res.data).slice(0, 3)))
      .catch(() => setPosts([]))
      .finally(() => setLoadingPosts(false));
  }, []);

  const heroProducts = useMemo(() => {
    const products = featured.length > 0 ? featured : newest;
    return products.slice(0, 3);
  }, [featured, newest]);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <img src={heroArt} alt="" className={styles.heroArt} />
        <div className={styles.heroShade} />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>TempoTempo Digital Store</p>
            <h1 className={styles.heroTitle}>
              خرید سریع و مطمئن محصولات دیجیتال بازی
            </h1>
            <p className={styles.heroText}>
              گیفت کارت، گیم تایم و شارژ حساب‌های بازی را با موجودی کنترل‌شده،
              سفارش امن و تجربه‌ای روان تهیه کن.
            </p>
            <div className={styles.heroActions}>
              <Link to="/shop" className={styles.primaryAction}>
                ورود به فروشگاه
              </Link>
              <Link to="/blog" className={styles.secondaryAction}>
                راهنمای خرید
              </Link>
            </div>
          </div>

          <div className={styles.heroSummary} aria-label="خلاصه فروشگاه">
            <span className={styles.summaryLabel}>امروز در فروشگاه</span>
            <div className={styles.summaryRows}>
              <span>محصولات فعال</span>
              <strong>{newest.length || "۴+"}</strong>
            </div>
            <div className={styles.summaryRows}>
              <span>دسته‌بندی‌ها</span>
              <strong>{categories.length || "۶+"}</strong>
            </div>
            <div className={styles.summaryRows}>
              <span>کد تخفیف دمو</span>
              <strong>DEMO10</strong>
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
                <em>از ${product.starting_price || "—"}</em>
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
              <h2 className={styles.sectionTitle}>راهنماها و مقالات</h2>
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
