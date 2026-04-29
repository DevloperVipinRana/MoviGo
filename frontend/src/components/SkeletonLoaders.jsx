/**
 * SkeletonLoaders.jsx
 * Shared skeleton components for Movies, Trailers, MoviesPage, ReleasePage.
 * Uses only Tailwind utility classes — no extra dependencies needed.
 *
 */

import React from "react";

// ─── Pulse keyframe (injected once) ───────────────────────────────────────────
const SHIMMER_CSS = `
@keyframes shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position:  600px 0; }
}
.sk-shimmer {
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.04) 0%,
    rgba(255,255,255,0.10) 40%,
    rgba(255,255,255,0.04) 80%
  );
  background-size: 600px 100%;
  animation: shimmer 1.6s infinite linear;
}
`;

let styleInjected = false;
const injectStyle = () => {
  if (styleInjected || typeof document === "undefined") return;
  const el = document.createElement("style");
  el.textContent = SHIMMER_CSS;
  document.head.appendChild(el);
  styleInjected = true;
};

// ─── Base block ───────────────────────────────────────────────────────────────
const Bone = ({ className = "", style = {} }) => {
  injectStyle();
  return (
    <div
      aria-hidden="true"
      className={`sk-shimmer rounded ${className}`}
      style={{ backgroundColor: "rgba(255,255,255,0.06)", ...style }}
    />
  );
};

// ─── 1. Single movie card skeleton (poster + title + category) ────────────────
export const MovieCardSkeleton = ({ delay = 0 }) => (
  <article
    aria-hidden="true"
    style={{ animationDelay: `${delay}ms` }}
    className="flex flex-col gap-2"
  >
    {/* poster */}
    <Bone className="w-full rounded-lg" style={{ aspectRatio: "2/3" }} />
    {/* title */}
    <Bone className="h-4 w-3/4 mt-1" />
    {/* category */}
    <Bone className="h-3 w-1/2" />
  </article>
);

// ─── 2. Full Movies section grid (6 cards) ────────────────────────────────────
export const MoviesGridSkeleton = ({ count = 6, gridClassName = "" }) => (
  <div
    aria-label="Loading movies…"
    className={
      gridClassName ||
      "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 px-2"
    }
  >
    {Array.from({ length: count }).map((_, i) => (
      <MovieCardSkeleton key={i} delay={i * 60} />
    ))}
  </div>
);

// ─── 3. Trailers section skeleton ─────────────────────────────────────────────
export const TrailersSkeleton = () => (
  <div aria-label="Loading trailers…" className="flex gap-4 w-full flex-col lg:flex-row">
    {/* ── Left panel ── */}
    <div className="flex flex-col gap-3 lg:w-[340px] w-full shrink-0">
      {/* heading */}
      <Bone className="h-6 w-40 mb-1" />

      {/* carousel strip */}
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone
            key={i}
            className="rounded-lg shrink-0"
            style={{ width: 220, height: 124, animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>

      {/* trending list */}
      <div className="flex flex-col gap-3 mt-2">
        <Bone className="h-4 w-28 mb-1" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 items-center">
            <Bone
              className="rounded shrink-0"
              style={{ width: 64, height: 44, animationDelay: `${i * 80}ms` }}
            />
            <div className="flex flex-col gap-2 flex-1">
              <Bone className="h-3 w-3/4" style={{ animationDelay: `${i * 80 + 40}ms` }} />
              <Bone className="h-3 w-1/2" style={{ animationDelay: `${i * 80 + 80}ms` }} />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* ── Right panel ── */}
    <div className="flex flex-col gap-4 flex-1 min-w-0">
      {/* video area */}
      <Bone className="w-full rounded-lg" style={{ aspectRatio: "16/9" }} />

      {/* title */}
      <Bone className="h-6 w-2/3" />

      {/* meta row */}
      <div className="flex gap-4">
        <Bone className="h-4 w-16" />
        <Bone className="h-4 w-16" />
      </div>

      {/* genre tags */}
      <div className="flex gap-2">
        {[60, 80, 50].map((w, i) => (
          <Bone key={i} className="h-6 rounded-full" style={{ width: w }} />
        ))}
      </div>

      {/* description lines */}
      <div className="flex flex-col gap-2">
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-5/6" />
        <Bone className="h-3 w-4/6" />
      </div>

      {/* credits */}
      <div className="flex gap-4 mt-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Bone
              className="rounded-full"
              style={{ width: 52, height: 52, animationDelay: `${i * 80}ms` }}
            />
            <Bone className="h-3 w-14" style={{ animationDelay: `${i * 80 + 40}ms` }} />
            <Bone className="h-3 w-10" style={{ animationDelay: `${i * 80 + 80}ms` }} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── 4. Movies page skeleton (category tabs + grid) ───────────────────────────
export const MoviesPageSkeleton = ({ count = 12 }) => (
  <div aria-label="Loading movies…" className="flex flex-col gap-6 w-full">
    {/* category tabs */}
    <div className="flex gap-3 flex-wrap">
      {[88, 64, 80, 72, 100].map((w, i) => (
        <Bone
          key={i}
          className="h-9 rounded-full"
          style={{ width: w, animationDelay: `${i * 50}ms` }}
        />
      ))}
    </div>

    {/* grid */}
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} delay={i * 40} />
      ))}
    </div>
  </div>
);

// ─── 5. Release page skeleton ─────────────────────────────────────────────────
export const ReleasePageSkeleton = ({ count = 8 }) => (
  <div aria-label="Loading releases…" className="flex flex-col gap-6 w-full">
    {/* header */}
    <div className="flex flex-col items-center gap-3 py-4">
      <Bone className="h-8 w-48" />
      <Bone className="h-4 w-36" />
    </div>

    {/* grid */}
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} delay={i * 50} />
      ))}
    </div>
  </div>
);