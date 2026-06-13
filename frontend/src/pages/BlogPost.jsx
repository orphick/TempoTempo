import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import styles from "./BlogPost.module.css";

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/blog/${slug}/`);
        setPost(res.data);
      } catch {
        navigate("/blog");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, navigate]);

  const paragraphs = useMemo(() => {
    if (!post?.content) return [];
    return post.content
      .replace(/<[^>]*>/g, "")
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [post]);

  if (loading) return <div className={styles.state}>در حال بارگذاری...</div>;
  if (!post) return null;

  const date = new Date(post.created_at).toLocaleDateString("fa-IR");

  return (
    <article className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="مسیر صفحه">
        <Link to="/">خانه</Link>
        <span>/</span>
        <Link to="/blog">بلاگ</Link>
        <span>/</span>
        <strong>{post.title}</strong>
      </nav>

      <header className={styles.header}>
        <time>{date}</time>
        <h1>{post.title}</h1>
        {post.excerpt && <p>{post.excerpt}</p>}
      </header>

      {post.image && (
        <div className={styles.imageWrap}>
          <img src={post.image} alt={post.title} />
        </div>
      )}

      <div className={styles.content}>
        {paragraphs.length > 0 ? (
          paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
        ) : (
          <p>محتوایی برای این مقاله ثبت نشده است.</p>
        )}
      </div>

      <Link className={styles.backLink} to="/blog">
        بازگشت به بلاگ
      </Link>
    </article>
  );
}
