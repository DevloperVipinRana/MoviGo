import React, { useEffect, useState } from "react";
import { releasesStyles } from "../assets/dummyStyles";
import { ReleasePageSkeleton } from "./SkeletonLoaders";

const PLACEHOLDER_IMG = "https://via.placeholder.com/400x600?text=No+Image";
const API_BASE        = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const CACHE_KEY       = "release_movies_cache";
const CACHE_TTL       = 10 * 60 * 1000;

const getUploadUrl = (v) => {
  if (!v) return null;
  if (typeof v !== "string") return null;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return `${API_BASE}/uploads/${v.replace(/^uploads\//, "")}`;
};

const mapBackendMovieToUi = (m) => {
  const poster = m.poster || m.latestTrailer?.thumbnail || null;
  const image  = getUploadUrl(poster) || PLACEHOLDER_IMG;
  const category =
    (Array.isArray(m.categories) && m.categories.join(", ")) ||
    (m.latestTrailer && Array.isArray(m.latestTrailer.genres) && m.latestTrailer.genres.join(", ")) ||
    "";
  return {
    id: m._id || m.id,
    title: m.movieName || m.title || m.latestTrailer?.title || "Untitled",
    image,
    category,
    raw: m,
  };
};

// ─── Cache ────────────────────────────────────────────────────────────────────
const readCache = () => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    const ts  = sessionStorage.getItem(`${CACHE_KEY}_time`);
    if (!raw || !ts) return { data: null, stale: false };
    const data  = JSON.parse(raw);
    const stale = Date.now() - parseInt(ts, 10) > CACHE_TTL;
    return Array.isArray(data) && data.length > 0 ? { data, stale } : { data: null, stale: false };
  } catch { return { data: null, stale: false }; }
};

const writeCache = (data) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
    sessionStorage.setItem(`${CACHE_KEY}_time`, Date.now().toString());
  } catch { /* quota */ }
};

// ─── Component ────────────────────────────────────────────────────────────────
const ReleasePage = () => {
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

    const load = async () => {
      try {
        const res  = await fetch(`${API_BASE}/api/movies?type=releaseSoon&limit=30`, { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json  = await res.json();
        const items = Array.isArray(json.items) ? json.items : Array.isArray(json.dataa) ? json.dataa : [];
        const mapped = items.map(mapBackendMovieToUi);
        setMovies(mapped);
        writeCache(mapped);
        setLoading(false);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Failed to Load", err);
        if (!cached) { setError("Failed to load releases"); setLoading(false); }
      }
    };

    load();
    return () => ac.abort();
  }, []);

  return (
    <div className={releasesStyles.pageContainer}>

      {loading ? (
        // Full page skeleton — header + grid
        <div className="px-4 py-6">
          <ReleasePageSkeleton count={8} />
        </div>

      ) : error ? (
        <div className="py-12 text-center text-red-400">{error}</div>

      ) : (
        <>
          <div className={releasesStyles.headerContainer}>
            <h1 className={releasesStyles.headerTitle}>RELEASES SOON</h1>
            <p  className={releasesStyles.headerSubtitle}>Latest Movies • Now Showing</p>
          </div>

          <div className={releasesStyles.movieGrid}>
            {movies.length === 0 ? (
              <div className="py-12 text-center text-gray-400 col-span-full">
                No upcoming releases found.
              </div>
            ) : (
              movies.map((movie) => (
                <div key={movie.id} className={releasesStyles.movieCard}>
                  <div className={releasesStyles.imageContainer}>
                    <img
                      src={movie.image}
                      alt={movie.title}
                      className={releasesStyles.movieImage}
                      loading="lazy"
                      onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }}
                    />
                  </div>
                  <div className={releasesStyles.movieInfo}>
                    <h3 className={releasesStyles.movieTitle}>{movie.title}</h3>
                    <p  className={releasesStyles.movieCategory}>{movie.category}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

    </div>
  );
};

export default ReleasePage;
