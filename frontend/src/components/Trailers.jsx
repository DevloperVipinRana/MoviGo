import React, { useEffect, useRef, useState } from "react";
import { trailersStyles, trailersCSS } from "../assets/dummyStyles";
import {
  Calendar, ChevronLeft, ChevronRight,
  Clapperboard, Clock, Play, X,
} from "lucide-react";
import { TrailersSkeleton } from "./SkeletonLoaders";

const API_BASE        = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const PLACEHOLDER_THUMB = "https://via.placeholder.com/800x450?text=No+Thumbnail";
const CACHE_KEY       = "trailers_cache";
const CACHE_TTL       = 15 * 60 * 1000;

// ─── Cache ────────────────────────────────────────────────────────────────────
const readCache = () => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    const ts  = sessionStorage.getItem(`${CACHE_KEY}_time`);
    if (!raw || !ts) return { data: null, stale: false };
    const data  = JSON.parse(raw);
    const stale = Date.now() - parseInt(ts, 10) > CACHE_TTL;
    return data?.trailers?.length > 0 ? { data, stale } : { data: null, stale: false };
  } catch { return { data: null, stale: false }; }
};

const writeCache = (trailers, featuredTrailer) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ trailers, featuredTrailer }));
    sessionStorage.setItem(`${CACHE_KEY}_time`, Date.now().toString());
  } catch { /* quota */ }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getUploadUrl = (input) => {
  if (!input) return null;
  if (typeof input === "string") {
    if (input.startsWith("http://") || input.startsWith("https://")) return input;
    return `${API_BASE}/uploads/${input}`;
  }
  if (typeof input === "object") {
    const p = input.url || input.path || input.filename || input.file || input.image || "";
    if (p) return getUploadUrl(p);
  }
  return null;
};

const formatDuration = (dur) => {
  if (!dur) return "";
  if (typeof dur === "string") return dur;
  if (typeof dur === "number") return `${dur}m`;
  const h = dur.hours ?? 0, m = dur.minutes ?? 0;
  if (h && m) return `${h}h ${m}m`;
  return h ? `${h}h` : m ? `${m}m` : "";
};

const mapMovieToTrailerItem = (movie) => {
  const lt          = movie.latestTrailer || {};
  const title       = lt.title || movie.movieName || movie.title || "Untitled";
  const thumbnail   = getUploadUrl(lt.thumbnail) || getUploadUrl(movie.poster) || PLACEHOLDER_THUMB;
  const videoUrl    = lt.videoId || lt.videoUrl || movie.trailerUrl || movie.videoUrl || "";
  const duration    = lt.duration ? formatDuration(lt.duration) : movie.duration ? formatDuration(movie.duration) : "";
  const year        = lt.year || movie.year || "";
  const genre       = lt.genres?.length ? lt.genres.join(", ") : movie.categories?.length ? movie.categories.join(", ") : "";
  const description = lt.description || movie.story || "";

  const credits = {};
  const firstDirector = (lt.directors || movie.directors || []).find(Boolean);
  const firstProducer = (lt.producers || movie.producers || []).find(Boolean);
  const firstSinger   = (lt.singers   || movie.singers   || []).find(Boolean);

  const personImg = (p) =>
    getUploadUrl(p.file) || getUploadUrl(p.image) || getUploadUrl(p.photo) || PLACEHOLDER_THUMB;

  if (firstDirector) credits["Director"] = { name: firstDirector.name || "Unknown", image: personImg(firstDirector) };
  if (firstProducer) credits["Producer"] = { name: firstProducer.name || "Unknown", image: personImg(firstProducer) };
  if (firstSinger)   credits["Singer"]   = { name: firstSinger.name   || "Unknown", image: personImg(firstSinger)   };

  return { id: movie._id || movie.id, title, thumbnail, videoUrl, duration, year, genre, description, credits };
};

const getEmbedBaseUrl = (videoUrl) => {
  if (!videoUrl) return "";
  try {
    const url  = new URL(videoUrl);
    const host = url.hostname.replace("www.", "").toLowerCase();
    if (host.includes("youtube.com")) {
      const vid = url.searchParams.get("v");
      if (vid) return `https://www.youtube.com/embed/${vid}`;
      if (url.pathname.includes("/embed/")) return `https://www.youtube.com${url.pathname}`;
    }
    if (host === "youtu.be") {
      const vid = url.pathname.replace("/", "");
      if (vid) return `https://www.youtube.com/embed/${vid}`;
    }
    if (host.includes("vimeo.com")) {
      const id = url.pathname.split("/").filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    return videoUrl;
  } catch { return videoUrl || ""; }
};

const buildIframeSrc = (videoUrl, isMuted) => {
  const base = getEmbedBaseUrl(videoUrl);
  if (!base) return "";
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}autoplay=1&mute=${isMuted ? 1 : 0}&rel=0`;
};

// ─── Component ────────────────────────────────────────────────────────────────
const Trailers = () => {
  const [featuredTrailer, setFeaturedTrailer] = useState(null);
  const [trailers, setTrailers]               = useState([]);
  const [isPlaying, setIsPlaying]             = useState(false);
  const [isMuted]                             = useState(false);
  const [loading, setLoading]                 = useState(() => readCache().data === null);
  const [error, setError]                     = useState(null);
  const videoRef    = useRef(null);
  const carouselRef = useRef(null);

  useEffect(() => {
    const ac = new AbortController();
    const { data: cached, stale } = readCache();

    if (cached) {
      setTrailers(cached.trailers);
      setFeaturedTrailer(cached.featuredTrailer);
      setLoading(false);
      if (!stale) return () => ac.abort();
    }

    const load = async () => {
      try {
        const res  = await fetch(`${API_BASE}/api/movies?type=latestTrailers&limit=20`, { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const items = Array.isArray(json.items) ? json.items : [];
        const mapped   = items.map(mapMovieToTrailerItem);
        const featured = mapped[0] || {
          id: "", title: "No Trailer Available", thumbnail: PLACEHOLDER_THUMB,
          videoUrl: "", duration: "", year: "", genre: "", description: "", credits: {},
        };
        setTrailers(mapped);
        setFeaturedTrailer(featured);
        writeCache(mapped, featured);
        setLoading(false);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Failed to load trailers", err);
        if (!cached) { setError("Failed to load trailers"); setLoading(false); }
      }
    };

    load();
    return () => ac.abort();
  }, []);

  const scrollLeft  = () => carouselRef.current?.scrollBy({ left: -280, behavior: "smooth" });
  const scrollRight = () => carouselRef.current?.scrollBy({ left:  280, behavior: "smooth" });

  const selectTrailer = (trailer) => {
    setFeaturedTrailer(trailer);
    setIsPlaying(false);
    try { if (videoRef.current) videoRef.current.currentTime = 0; } catch { /* ignore */ }
    try {
      if (carouselRef.current) {
        const el = carouselRef.current.querySelector(`[data-id='${trailer.id}']`);
        if (el) {
          const rect       = el.getBoundingClientRect();
          const parentRect = carouselRef.current.getBoundingClientRect();
          carouselRef.current.scrollBy({
            left: rect.left - parentRect.left - parentRect.width / 2 + rect.width / 2,
            behavior: "smooth",
          });
        }
      }
    } catch { /* ignore */ }
  };

  const safeFeatured = featuredTrailer || {
    id: "", title: "No trailer selected", thumbnail: PLACEHOLDER_THUMB,
    videoUrl: "", duration: "", year: "", genre: "", description: "", credits: {},
  };

  if (error && !loading && trailers.length === 0) {
    return (
      <div className={trailersStyles.container}>
        <div className="py-12 text-center text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className={trailersStyles.container}>
      <main className={trailersStyles.main}>

        {/* ── Full skeleton while loading for the first time ── */}
        {loading ? (
          <div className="px-4 py-6">
            <TrailersSkeleton />
          </div>
        ) : trailers.length === 0 ? (
          <div className="py-12 text-center text-gray-300">
            No trailers found yet.
          </div>
        ) : (
          <div className={trailersStyles.layout}>

            {/* ── Left side ── */}
            <div className={trailersStyles.leftSide}>
              <div className={trailersStyles.leftCard}>
                <h2
                  className={trailersStyles.leftTitle}
                  style={{ fontFamily: "Monoton, cursive" }}
                >
                  <Clapperboard className={trailersStyles.titleIcon} />
                  Latest Trailers
                </h2>

                <div className={trailersStyles.carouselControls}>
                  <div className={trailersStyles.controlButtons}>
                    <button onClick={scrollLeft}  className={trailersStyles.controlButton}><ChevronLeft  size={18} /></button>
                    <button onClick={scrollRight} className={trailersStyles.controlButton}><ChevronRight size={18} /></button>
                  </div>
                  <span className={trailersStyles.trailerCount}>{trailers.length} Trailers</span>
                </div>

                <div
                  ref={carouselRef}
                  className={trailersStyles.carousel}
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {trailers.map((trailer) => (
                    <div
                      key={trailer.id}
                      data-id={trailer.id}
                      className={`${trailersStyles.carouselItem.base} ${
                        safeFeatured.id === trailer.id
                          ? trailersStyles.carouselItem.active
                          : trailersStyles.carouselItem.inactive
                      }`}
                      style={{ width: "220px", height: "124px", minWidth: "220px" }}
                      onClick={() => selectTrailer(trailer)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") selectTrailer(trailer); }}
                      aria-pressed={safeFeatured.id === trailer.id}
                    >
                      <img
                        src={trailer.thumbnail || PLACEHOLDER_THUMB}
                        alt={trailer.title}
                        className={trailersStyles.carouselImage}
                        loading="lazy"
                      />
                      <div className={trailersStyles.carouselOverlay}>
                        <h3 className={trailersStyles.carouselTitle}>{trailer.title}</h3>
                        <p  className={trailersStyles.carouselGenre}>{trailer.genre}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={trailersStyles.trendingSection}>
                  <h3 className={trailersStyles.trendingTitle}>Now Trending</h3>
                  {trailers.slice(0, 3).map((trailer) => (
                    <div
                      key={trailer.id}
                      onClick={() => selectTrailer(trailer)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") selectTrailer(trailer); }}
                      className={trailersStyles.trendingItem}
                    >
                      <div className={trailersStyles.trendingImage}>
                        <img src={trailer.thumbnail || PLACEHOLDER_THUMB} alt={trailer.title} className={trailersStyles.trendingImageSrc} loading="lazy" />
                      </div>
                      <div className={trailersStyles.trendingContent}>
                        <h4 className={trailersStyles.trendingItemTitle}>{trailer.title}</h4>
                        <p  className={trailersStyles.trendingItemGenre}>{trailer.genre}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right side ── */}
            <div className={trailersStyles.rightSide}>
              <div className={trailersStyles.rightCard}>
                <div className={trailersStyles.videoContainer}>
                  {isPlaying ? (
                    <div className={trailersStyles.videoWrapper}>
                      <iframe
                        className={trailersStyles.videoIframe}
                        src={buildIframeSrc(safeFeatured.videoUrl, isMuted)}
                        title={safeFeatured.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        ref={videoRef}
                      />
                      <div className={trailersStyles.closeButton}>
                        <button title="Close" onClick={() => setIsPlaying(false)} className={trailersStyles.closeButtonInner}>
                          <X size={28} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={trailersStyles.thumbnailContainer}>
                      <img src={safeFeatured.thumbnail} alt={safeFeatured.title} className={trailersStyles.thumbnailImage} loading="eager" />
                      <div className={trailersStyles.playButtonContainer}>
                        <button onClick={() => setIsPlaying(true)} className={trailersStyles.playButton}>
                          <Play size={32} fill="white" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className={trailersStyles.trailerInfo}>
                  <div className={trailersStyles.infoHeader}>
                    <h2 className={trailersStyles.trailerTitle}>{safeFeatured.title}</h2>
                    <div className={trailersStyles.trailerMeta}>
                      <span className={trailersStyles.metaItem}><Clock     size={16} className={trailersStyles.metaIcon} />{safeFeatured.duration}</span>
                      <span className={trailersStyles.metaItem}><Calendar  size={16} className={trailersStyles.metaIcon} />{safeFeatured.year}</span>
                    </div>
                  </div>

                  <div className={trailersStyles.genreContainer}>
                    {(safeFeatured.genre || "").split(",").map((genre, i) => (
                      <span key={i} className={trailersStyles.genreTag}>{genre.trim()}</span>
                    ))}
                  </div>

                  <p className={trailersStyles.description}>{safeFeatured.description}</p>

                  <div className={trailersStyles.credits}>
                    <h3 className={trailersStyles.creditsTitle}>Credits</h3>
                    <div className={trailersStyles.creditsGrid}>
                      {safeFeatured.credits &&
                        Object.entries(safeFeatured.credits).map(([role, person]) => (
                          <div key={role} className={trailersStyles.creditItem}>
                            <div className={trailersStyles.creditImage}>
                              <img src={person.image} alt={person.name} className={trailersStyles.creditImageSrc} loading="lazy" />
                            </div>
                            <div className={trailersStyles.creditName}>{person.name}</div>
                            <div className={trailersStyles.creditRole}>{role}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
      <style>{trailersCSS}</style>
    </div>
  );
};

export default Trailers;
