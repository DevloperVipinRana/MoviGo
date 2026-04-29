import React, { useEffect, useState } from "react";
import { moviesStyles } from "../assets/dummyStyles";
import { Link } from "react-router-dom";
import { Tickets } from "lucide-react";
import { MoviesGridSkeleton } from "./SkeletonLoaders";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const PLACEHOLDER = "https://via.placeholder.com/400x600?text=No+Poster";
const CACHE_KEY = "featured_movies_cache";
const CACHE_TTL = 10 * 60 * 1000;

const getUploadUrl = (maybe) => {
  if (!maybe) return null;
  if (typeof maybe !== "string") return null;
  if (maybe.startsWith("http://") || maybe.startsWith("https://")) return maybe;
  return `${API_BASE}/uploads/${String(maybe).replace(/^uploads\//, "")}`;
};

const readCache = () => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    const ts  = sessionStorage.getItem(`${CACHE_KEY}_time`);
    if (!raw || !ts) return { data: null, stale: false };
    const data  = JSON.parse(raw);
    const stale = Date.now() - parseInt(ts, 10) > CACHE_TTL;
    return Array.isArray(data) && data.length > 0
      ? { data, stale }
      : { data: null, stale: false };
  } catch { return { data: null, stale: false }; }
};

const writeCache = (data) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
    sessionStorage.setItem(`${CACHE_KEY}_time`, Date.now().toString());
  } catch { /* quota */ }
};

const fetchFeatured = async (signal) => {
  // Primary: ask backend for type=featured specifically
  const res = await fetch(`${API_BASE}/api/movies?type=featured&limit=20`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json  = await res.json();
  const items = json.items ?? (Array.isArray(json) ? json : []);

  // Filter client-side too (covers featured/isFeatured boolean flags)
  const featured = items.filter(
    (it) =>
      it?.featured === true ||
      it?.isFeatured === true ||
      String(it?.type)?.toLowerCase() === "featured",
  );

  // Fallback: if backend returned nothing for type=featured,
  // do a second fetch without the type filter and filter client-side
  if (featured.length === 0) {
    const res2   = await fetch(`${API_BASE}/api/movies?limit=50`, { signal });
    if (!res2.ok) throw new Error(`HTTP ${res2.status}`);
    const json2  = await res2.json();
    const items2 = json2.items ?? (Array.isArray(json2) ? json2 : []);
    const featured2 = items2.filter(
      (it) =>
        it?.featured === true ||
        it?.isFeatured === true ||
        String(it?.type)?.toLowerCase() === "featured",
    );
    return featured2.slice(0, 6);
  }

  return featured.slice(0, 6);
};

const Movies = () => {
  const [movies, setMovies]   = useState([]);
  const [loading, setLoading] = useState(() => readCache().data === null);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const ac = new AbortController();
    const { data: cached, stale } = readCache();

    if (cached) {
      setMovies(cached);
      setLoading(false);
      if (!stale) return () => ac.abort();
    }

    fetchFeatured(ac.signal)
      .then((items) => { setMovies(items); writeCache(items); setLoading(false); })
      .catch((err) => {
        if (err.name === "AbortError") return;
        console.error("Movies load error", err);
        if (!cached) { setError("Failed to load movies"); setLoading(false); }
      });

    return () => ac.abort();
  }, []);

  return (
    <section className={moviesStyles.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Pacifico&display=swap');
      `}</style>

      <h2 style={{ fontFamily: "'Dancing Script', cursive" }} className={moviesStyles.title}>
        Featured Movies
      </h2>

      {loading ? (
        <MoviesGridSkeleton count={6} gridClassName={moviesStyles.grid} />
      ) : error ? (
        <div className="text-red-400 py-12 text-center">{error}</div>
      ) : movies.length === 0 ? (
        <div className="text-gray-400 py-12 text-center">No featured movies found.</div>
      ) : (
        <div className={moviesStyles.grid}>
          {movies.map((m) => {
            const rawImg   = m.poster || m.latestTrailer?.thumbnail || m.thumbnail || null;
            const imgSrc   = getUploadUrl(rawImg) || PLACEHOLDER;
            const title    = m.movieName || m.title || "Untitled";
            const category =
              (Array.isArray(m.categories) && m.categories[0]) ||
              m.category || "General";
            const movieId  = m._id || m.id || title;

            return (
              <article key={movieId} className={moviesStyles.movieArticle}>
                <Link to={`/movie/${movieId}`} className={moviesStyles.movieLink}>
                  <img
                    src={imgSrc}
                    alt={title}
                    loading="lazy"
                    className={moviesStyles.movieImage}
                    onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                  />
                </Link>
                <div className={moviesStyles.movieInfo}>
                  <div className={moviesStyles.titleContainer}>
                    <Tickets size={20} className="text-red-600 mr-2" />
                    <span
                      id={`movie-title-${movieId}`}
                      className={moviesStyles.movieTitle}
                      style={{ fontFamily: "'Pacifico', cursive" }}
                    >
                      {title}
                    </span>
                  </div>
                  <div className={moviesStyles.categoryContainer}>
                    <span className={moviesStyles.categoryText}>{category}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default Movies;
