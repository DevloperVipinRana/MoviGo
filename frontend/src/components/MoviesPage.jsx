import React, { useEffect, useState } from "react";
import { moviesPageStyles } from "../assets/dummyStyles";
import { Link } from "react-router-dom";
import { MoviesPageSkeleton } from "./SkeletonLoaders";

const API_BASE       = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const COLLAPSE_COUNT = 12;
const PLACEHOLDER    = "https://via.placeholder.com/400x600?text=No+Poster";
const CACHE_KEY      = "movies_page_cache";
const CACHE_TTL      = 5 * 60 * 1000;

const getUploadUrl = (maybe) => {
  if (!maybe) return null;
  if (typeof maybe !== "string") return null;
  if (maybe.startsWith("http://") || maybe.startsWith("https://")) return maybe;
  return `${API_BASE}/uploads/${String(maybe).replace(/^uploads\//, "")}`;
};

const categoriesList = [
  { id: "all",       name: "All Movies"  },
  { id: "action",    name: "Action"      },
  { id: "horror",    name: "Horror"      },
  { id: "comedy",    name: "Comedy"      },
  { id: "adventure", name: "Adventure"   },
];

const mapBackendMovie = (m) => {
  const id    = m._id || m.id || "";
  const title = m.movieName || m.title || "Untitled";
  const rawImg = m.poster || m.latestTrailer?.thumbnail || m.thumbnail || null;
  const image  = getUploadUrl(rawImg) || PLACEHOLDER;
  const cat    =
    (Array.isArray(m.categories) && m.categories[0]) ||
    m.category ||
    (Array.isArray(m.latestTrailer?.genres) && m.latestTrailer.genres[0]) ||
    "General";
  return { id, title, image, category: String(cat || "General"), raw: m };
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
const MoviesPage = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [showAll, setShowAll]               = useState(false);
  const [movies, setMovies]                 = useState([]);
  const [loading, setLoading]               = useState(() => readCache().data === null);
  const [error, setError]                   = useState(null);

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
        const res = await fetch(`${API_BASE}/api/movies?type=normal&limit=50`, { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json  = await res.json();
        const items = Array.isArray(json.items) ? json.items : [];
        const mapped = items.map(mapBackendMovie);
        setMovies(mapped);
        writeCache(mapped);
        setLoading(false);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Failed to load movies:", err);
        // silent fallback — try without type filter
        try {
          const res2  = await fetch(`${API_BASE}/api/movies?limit=50`, { signal: ac.signal });
          if (!res2.ok) throw new Error(`Fallback HTTP ${res2.status}`);
          const json2  = await res2.json();
          const mapped2 = (Array.isArray(json2.items) ? json2.items : []).map(mapBackendMovie);
          setMovies(mapped2);
          writeCache(mapped2);
          setLoading(false);
        } catch (err2) {
          if (err2.name === "AbortError") return;
          if (!cached) { setError("Unable to load movies."); setLoading(false); }
        }
      }
    };

    load();
    return () => ac.abort();
  }, []);

  const filteredMovies = React.useMemo(() => {
    if (activeCategory === "all") return movies;
    return movies.filter(
      (m) => String(m.category || "").toLowerCase() === String(activeCategory || "").toLowerCase(),
    );
  }, [movies, activeCategory]);

  useEffect(() => { setShowAll(false); }, [activeCategory]);

  const visibleMovies = showAll ? filteredMovies : filteredMovies.slice(0, COLLAPSE_COUNT);

  return (
    <div className={moviesPageStyles.container}>

      {/* ── Category tabs — always visible (real or skeleton) ── */}
      <section className={moviesPageStyles.categoriesSection}>
        <div className={moviesPageStyles.categoriesContainer}>
          <div className={moviesPageStyles.categoriesFlex}>
            {categoriesList.map((category) => (
              <button
                key={category.id}
                className={`${moviesPageStyles.categoryButton.base} ${
                  activeCategory === category.id
                    ? moviesPageStyles.categoryButton.active
                    : moviesPageStyles.categoryButton.inactive
                }`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={moviesPageStyles.moviesSection}>
        <div className={moviesPageStyles.moviesContainer}>

          {loading ? (
            // Skeleton grid — matches real layout exactly (no layout shift)
            <MoviesPageSkeleton count={COLLAPSE_COUNT} />

          ) : error ? (
            <div className="py-12 text-center text-red-400">{error}</div>

          ) : (
            <>
              <div className={moviesPageStyles.moviesGrid}>
                {visibleMovies.map((movie) => (
                  <Link
                    key={movie.id}
                    to={`/movies/${movie.id}`}
                    state={{ movie }}
                    className={moviesPageStyles.movieCard}
                  >
                    <div className={moviesPageStyles.movieImageContainer}>
                      <img
                        src={movie.image}
                        alt={movie.title}
                        className={moviesPageStyles.movieImage}
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                      />
                    </div>
                    <div className={moviesPageStyles.movieInfo}>
                      <h3 className={moviesPageStyles.movieTitle}>{movie.title}</h3>
                      <div className={moviesPageStyles.movieCategory}>
                        <span className={moviesPageStyles.movieCategoryText}>{movie.category}</span>
                      </div>
                    </div>
                  </Link>
                ))}

                {filteredMovies.length === 0 && (
                  <div className={moviesPageStyles.emptyState}>
                    No movies found in this category.
                  </div>
                )}
              </div>

              {filteredMovies.length > COLLAPSE_COUNT && (
                <div className={moviesPageStyles.showMoreContainer}>
                  <button
                    onClick={() => setShowAll((prev) => !prev)}
                    className={moviesPageStyles.showMoreButton}
                    type="button"
                  >
                    {showAll
                      ? "Show Less"
                      : `Show More (${filteredMovies.length - COLLAPSE_COUNT} more)`}
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </section>
    </div>
  );
};

export default MoviesPage;

