import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import styles from "./Blog.module.css";

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/blog/");
        setPosts(res.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <span className={styles.eyebrow}>مجله تمپوتمپو</span>
        <h1>راهنمای خرید و اخبار دنیای بازی</h1>
        <p>مطالب کوتاه و کاربردی برای انتخاب بهتر گیفت کارت، اشتراک و آیتم‌های دیجیتال.</p>
      </header>

      {loading ? (
        <div className={styles.state}>در حال بارگذاری...</div>
      ) : posts.length === 0 ? (
        <div className={styles.state}>هنوز مقاله‌ای منتشر نشده است.</div>
      ) : (
        <div className={styles.grid}>
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}

function BlogCard({ post }) {
  const date = new Date(post.created_at).toLocaleDateString("fa-IR");

  return (
    <Link to={`/blog/${post.slug}`} className={styles.card}>
      <div
        className={styles.image}
        style={post.image ? { backgroundImage: `url(${post.image})` } : undefined}
      >
        {!post.image && <span>تمپوتمپو</span>}
      </div>
      <div className={styles.body}>
        <time>{date}</time>
        <h2>{post.title}</h2>
        {post.excerpt && <p>{post.excerpt}</p>}
        <strong>ادامه مطلب</strong>
      </div>
    </Link>
  );
}
