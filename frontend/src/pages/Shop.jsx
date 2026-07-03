import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import ProductCard from "../components/ProductCard";
import { ProductCardSkeleton } from "../components/Skeleton";
import styles from "./Shop.module.css";

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: "newest", label: "جدیدترین" },
  { value: "price-low", label: "ارزان‌ترین" },
  { value: "price-high", label: "گران‌ترین" },
  { value: "name", label: "نام محصول" },
];

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortMode, setSortMode] = useState("newest");
  const activeCategory = searchParams.get("category") || "";
  const debounceRef = useRef(null);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const selectedCategory = categories.find((c) => c.slug === activeCategory);

  const pageTitle = activeCategory
    ? selectedCategory?.name || "محصولات"
    : searchQuery
      ? `نتایج جستجو برای «${searchQuery}»`
      : "همه محصولات";

  const sortedProducts = useMemo(() => {
    const list = [...products];
    if (sortMode === "price-low") {
      return list.sort((a, b) => Number(a.starting_price || 0) - Number(b.starting_price || 0));
    }
    if (sortMode === "price-high") {
      return list.sort((a, b) => Number(b.starting_price || 0) - Number(a.starting_price || 0));
    }
    if (sortMode === "name") {
      return list.sort((a, b) => a.name.localeCompare(b.name, "fa"));
    }
    return list;
  }, [products, sortMode]);

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    setCurrentPage(1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(val.trim());
    }, 400);
  };

  const updateCategory = (slug = "") => {
    setCurrentPage(1);
    setSearchParams(slug ? { category: slug } : {});
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setSortMode("newest");
    setCurrentPage(1);
    setSearchParams({});
  };

  useEffect(() => {
    api
      .get("/products/categories/")
      .then((res) => setCategories(res.data.results || res.data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (activeCategory) params.append("category", activeCategory);
        if (searchQuery) params.append("search", searchQuery);
        params.append("page", currentPage);
        const res = await api.get(`/products/?${params.toString()}`);
        if (!cancelled) {
          setProducts(res.data.results || []);
          setTotalCount(res.data.count || 0);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
          setTotalCount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [activeCategory, searchQuery, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    const pages = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className={styles.wrapper}>
      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>فروشگاه تمپوتمپو</p>
          <h1>فروشگاه محصولات دیجیتال بازی</h1>
          <p>
            محصول مورد نظر را بر اساس دسته‌بندی، نام، قیمت و موجودی پیدا کن و
            وارد صفحه خرید شو.
          </p>
        </div>
        <div className={styles.heroStats}>
          <span>
            <strong>{totalCount}</strong>
            محصول یافت‌شده
          </span>
          <span>
            <strong>{categories.length || "—"}</strong>
            دسته‌بندی فعال
          </span>
        </div>
      </section>

      <div className={styles.quickFilters}>
        <button
          className={`${styles.chip} ${!activeCategory ? styles.chipActive : ""}`}
          onClick={() => updateCategory("")}
        >
          همه محصولات
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`${styles.chip} ${activeCategory === cat.slug ? styles.chipActive : ""}`}
            onClick={() => updateCategory(activeCategory === cat.slug ? "" : cat.slug)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.filterHeader}>
            <span>فیلترها</span>
            <button onClick={clearFilters}>پاک‌سازی</button>
          </div>

          <div className={styles.filterGroup}>
            <label>جستجو</label>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="نام محصول، پلتفرم یا کارت..."
              value={searchInput}
              onChange={handleSearch}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>دسته‌بندی</label>
            <div className={styles.categoryList}>
              <button
                className={`${styles.categoryBtn} ${!activeCategory ? styles.active : ""}`}
                onClick={() => updateCategory("")}
              >
                <span>همه محصولات</span>
                <em>{totalCount}</em>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`${styles.categoryBtn} ${activeCategory === cat.slug ? styles.active : ""}`}
                  onClick={() => updateCategory(activeCategory === cat.slug ? "" : cat.slug)}
                >
                  <span>{cat.name}</span>
                  <em>›</em>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.noteBox}>
            <strong>راهنمای سریع</strong>
            <p>قبل از خرید، منطقه و پلتفرم محصول را در صفحه جزئیات بررسی کن.</p>
          </div>
        </aside>

        <main className={styles.main}>
          <div className={styles.toolbar}>
            <div>
              <p className={styles.resultLabel}>نتایج فروشگاه</p>
              <h2>{pageTitle}</h2>
            </div>
            <div className={styles.toolbarActions}>
              <span className={styles.count}>{totalCount} محصول</span>
              <select
                className={styles.sortSelect}
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value)}
                aria-label="مرتب‌سازی محصولات"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(activeCategory || searchQuery) && (
            <div className={styles.activeFilters}>
              {activeCategory && <span>{selectedCategory?.name || "دسته انتخاب‌شده"}</span>}
              {searchQuery && <span>جستجو: {searchQuery}</span>}
              <button onClick={clearFilters}>حذف همه</button>
            </div>
          )}

          {loading ? (
            <div className={styles.grid}>
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className={styles.empty}>
              <strong>محصولی پیدا نشد</strong>
              <p>عبارت جستجو یا دسته‌بندی را تغییر بده تا نتایج بیشتری ببینی.</p>
              <button onClick={clearFilters}>نمایش همه محصولات</button>
            </div>
          ) : (
            <div className={styles.grid}>
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                قبلی
              </button>

              {currentPage > 3 && (
                <>
                  <button className={styles.pageBtn} onClick={() => handlePageChange(1)}>
                    ۱
                  </button>
                  {currentPage > 4 && <span className={styles.pageInfo}>...</span>}
                </>
              )}

              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  className={`${styles.pageBtn} ${currentPage === page ? styles.pageBtnActive : ""}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}

              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && <span className={styles.pageInfo}>...</span>}
                  <button
                    className={styles.pageBtn}
                    onClick={() => handlePageChange(totalPages)}
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                className={styles.pageBtn}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                بعدی
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
