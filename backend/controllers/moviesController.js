import mongoose from "mongoose";
import Movie from "../models/movieModel.js";
import { deleteFromCloudinary, extractPublicId } from "../config/cloudinary.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getCloudinaryUrl = (val) => {
  if (!val) return null;
  if (typeof val === "string" && /^https?:\/\//.test(val)) return val;
  return null;
};

// Reads the Cloudinary URL from a processed multer file object.
// processUploadsToCloudinary() sets both file.cloudinaryUrl and file.path.
const fileToUrl = (file) => {
  if (!file) return null;
  return file.cloudinaryUrl || file.path || null;
};

const safeParseJSON = (v) => {
  if (!v) return null;
  if (typeof v === "object") return v;
  try { return JSON.parse(v); } catch { return null; }
};

const normalizeLatestPersonUrl = (value) => {
  if (!value) return null;
  if (typeof value === "string" && /^https?:\/\//.test(value)) return value;
  return null;
};

const personToPreview = (p) => {
  if (!p) return { name: "", role: "", preview: null };
  const url = p.preview || p.file || p.image || p.url || null;
  return {
    name:    p.name || "",
    role:    p.role || "",
    preview: getCloudinaryUrl(url),
  };
};

// ─── Transformers ─────────────────────────────────────────────────────────────

const buildLatestTrailerPeople = (arr = []) =>
  (arr || []).map((p) => ({
    name: (p && p.name) || "",
    role: (p && p.role) || "",
    file: normalizeLatestPersonUrl(
      p && (p.file || p.preview || p.url || p.image)
    ),
  }));

const enrichLatestTrailerForOutput = (lt = {}) => {
  const copy = { ...lt };
  copy.thumbnail = getCloudinaryUrl(copy.thumbnail) || null;
  const mapPerson = (p) => {
    const c = { ...(p || {}) };
    c.preview = getCloudinaryUrl(c.file) || getCloudinaryUrl(c.preview) || null;
    c.name    = c.name || "";
    c.role    = c.role || "";
    return c;
  };
  copy.directors = (copy.directors || []).map(mapPerson);
  copy.producers = (copy.producers || []).map(mapPerson);
  copy.singers   = (copy.singers   || []).map(mapPerson);
  return copy;
};

const normalizeItemForOutput = (it = {}) => {
  const obj = { ...it };
  obj.thumbnail =
    getCloudinaryUrl(it.latestTrailer?.thumbnail) ||
    getCloudinaryUrl(it.poster) ||
    null;
  obj.trailerUrl =
    it.trailerUrl || it.latestTrailer?.url || it.latestTrailer?.videoId || null;

  if (it.type === "latestTrailers" && it.latestTrailer) {
    const lt = it.latestTrailer;
    obj.genres      = obj.genres      || lt.genres      || [];
    obj.year        = obj.year        || lt.year        || null;
    obj.rating      = obj.rating      || lt.rating      || null;
    obj.duration    = obj.duration    || lt.duration    || null;
    obj.description = obj.description || lt.description || lt.excerpt || "";
  }

  obj.cast      = (it.cast      || []).map(personToPreview);
  obj.directors = (it.directors || []).map(personToPreview);
  obj.producers = (it.producers || []).map(personToPreview);

  if (it.latestTrailer)
    obj.latestTrailer = enrichLatestTrailerForOutput(it.latestTrailer);

  obj.auditorium = it.auditorium || null;
  return obj;
};

const tryDeleteCloudinaryUrl = (url) => {
  const publicId = extractPublicId(url);
  if (publicId) deleteFromCloudinary(publicId);
};

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createMovie(req, res) {
  try {
    const body = req.body || {};

    // ── Main file assets ───────────────────────────────────────────────────────
    const posterUrl  = req.files?.poster?.[0]     ? fileToUrl(req.files.poster[0])     : getCloudinaryUrl(body.poster)    || null;
    const trailerUrl = req.files?.trailerUrl?.[0] ? fileToUrl(req.files.trailerUrl[0]) : getCloudinaryUrl(body.trailerUrl) || body.trailerUrl || null;
    const videoUrl   = req.files?.videoUrl?.[0]   ? fileToUrl(req.files.videoUrl[0])   : getCloudinaryUrl(body.videoUrl)   || body.videoUrl   || null;

    // ── Scalar fields ──────────────────────────────────────────────────────────
    const categories =
      safeParseJSON(body.categories) ||
      (body.categories
        ? String(body.categories).split(",").map((s) => s.trim()).filter(Boolean)
        : []);

    const slots      = safeParseJSON(body.slots)      || [];
    const seatPrices = safeParseJSON(body.seatPrices) || {
      standard: Number(body.standard || 0),
      recliner: Number(body.recliner || 0),
    };

    // ── People arrays ──────────────────────────────────────────────────────────
    const cast      = safeParseJSON(body.cast)      || [];
    const directors = safeParseJSON(body.directors) || [];
    const producers = safeParseJSON(body.producers) || [];

    const attachFiles = (fieldName, targetArr) => {
      if (!req.files?.[fieldName]) return;
      req.files[fieldName].forEach((file, idx) => {
        const url = fileToUrl(file);
        if (targetArr[idx]) targetArr[idx].file = url;
        else targetArr[idx] = { name: "", file: url };
      });
    };

    attachFiles("castFiles",     cast);
    attachFiles("directorFiles", directors);
    attachFiles("producerFiles", producers);

    // ── Latest Trailer ─────────────────────────────────────────────────────────
    const latestTrailerBody = safeParseJSON(body.latestTrailer) || {};

    if (req.files?.ltThumbnail?.[0]) {
      latestTrailerBody.thumbnail = fileToUrl(req.files.ltThumbnail[0]);
    } else if (body.ltThumbnail && /^https?:\/\//.test(body.ltThumbnail)) {
      latestTrailerBody.thumbnail = body.ltThumbnail;
    }

    if (body.ltVideoUrl) latestTrailerBody.videoId = body.ltVideoUrl;
    if (body.ltUrl)      latestTrailerBody.url     = body.ltUrl;
    if (body.ltTitle)    latestTrailerBody.title   = body.ltTitle;

    latestTrailerBody.directors = latestTrailerBody.directors || [];
    latestTrailerBody.producers = latestTrailerBody.producers || [];
    latestTrailerBody.singers   = latestTrailerBody.singers   || [];

    const attachLtFiles = (fieldName, arrName) => {
      if (!req.files?.[fieldName]) return;
      req.files[fieldName].forEach((file, idx) => {
        const url = fileToUrl(file);
        if (latestTrailerBody[arrName][idx]) latestTrailerBody[arrName][idx].file = url;
        else latestTrailerBody[arrName][idx] = { name: "", file: url };
      });
    };

    attachLtFiles("ltDirectorFiles", "directors");
    attachLtFiles("ltProducerFiles", "producers");
    attachLtFiles("ltSingerFiles",   "singers");

    latestTrailerBody.directors = buildLatestTrailerPeople(latestTrailerBody.directors);
    latestTrailerBody.producers = buildLatestTrailerPeople(latestTrailerBody.producers);
    latestTrailerBody.singers   = buildLatestTrailerPeople(latestTrailerBody.singers);

    // ── Auditorium ─────────────────────────────────────────────────────────────
    const auditoriumValue =
      typeof body.auditorium === "string" && body.auditorium.trim()
        ? body.auditorium.trim()
        : "Audi 1";

    // ── Persist ────────────────────────────────────────────────────────────────
    const doc = new Movie({
      _id:       new mongoose.Types.ObjectId(),
      type:      body.type      || "normal",
      movieName: body.movieName || body.title || "",
      categories,
      poster:    posterUrl,
      trailerUrl,
      videoUrl,
      rating:    Number(body.rating)   || 0,
      duration:  Number(body.duration) || 0,
      slots,
      seatPrices,
      cast,
      directors,
      producers,
      story:         body.story || "",
      latestTrailer: latestTrailerBody,
      auditorium:    auditoriumValue,
    });

    const saved = await doc.save();
    return res.status(201).json({
      success: true,
      message: "Movie created successfully",
      data: saved,
    });
  } catch (err) {
    console.error("CreateMovie Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create movie: " + err.message,
    });
  }
}

// ─── GET ALL ──────────────────────────────────────────────────────────────────

export async function getMovies(req, res) {
  try {
    const {
      category,
      type,
      sort  = "-createdAt",
      page  = 1,
      limit = 520,
      search,
      latestTrailers,
    } = req.query;

    let filter = {};
    if (typeof category === "string" && category.trim())
      filter.categories = { $in: [category.trim()] };
    if (typeof type === "string" && type.trim())
      filter.type = type.trim();
    if (typeof search === "string" && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { movieName:             { $regex: q, $options: "i" } },
        { "latestTrailer.title": { $regex: q, $options: "i" } },
        { story:                 { $regex: q, $options: "i" } },
      ];
    }
    if (latestTrailers && String(latestTrailers).toLowerCase() !== "false") {
      filter =
        Object.keys(filter).length === 0
          ? { type: "latestTrailers" }
          : { $and: [filter, { type: "latestTrailers" }] };
    }

    const pg   = Math.max(1, parseInt(page,  10) || 1);
    const lim  = Math.min(200, parseInt(limit, 10) || 12);
    const skip = (pg - 1) * lim;

    const total = await Movie.countDocuments(filter);
    const items = await Movie.find(filter).sort(sort).skip(skip).limit(lim).lean();

    return res.json({
      success: true,
      total,
      page:  pg,
      limit: lim,
      items: (items || []).map(normalizeItemForOutput),
    });
  } catch (err) {
    console.error("GetMovies error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// ─── GET BY ID ────────────────────────────────────────────────────────────────

export async function getMovieById(req, res) {
  try {
    const { id } = req.params;
    if (!id)
      return res.status(400).json({ success: false, message: "Movie ID is required" });

    const item = await Movie.findById(id).lean();
    if (!item)
      return res.status(404).json({ success: false, message: "Movie not found" });

    const obj = normalizeItemForOutput(item);

    if (item.type === "latestTrailers" && item.latestTrailer) {
      const lt = item.latestTrailer;
      obj.genres      = obj.genres      || lt.genres      || [];
      obj.year        = obj.year        || lt.year        || null;
      obj.rating      = obj.rating      || lt.rating      || null;
      obj.duration    = obj.duration    || lt.duration    || null;
      obj.description = obj.description || lt.description || lt.excerpt || "";
    }

    return res.json({ success: true, item: obj });
  } catch (err) {
    console.error("GetMovieById error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteMovie(req, res) {
  try {
    const { id } = req.params;
    if (!id)
      return res.status(400).json({ success: false, message: "Movie ID is required" });

    const m = await Movie.findById(id).lean();
    if (!m)
      return res.status(404).json({ success: false, message: "Movie not found" });

    if (m.poster)                   tryDeleteCloudinaryUrl(m.poster);
    if (m.latestTrailer?.thumbnail) tryDeleteCloudinaryUrl(m.latestTrailer.thumbnail);

    [m.cast || [], m.directors || [], m.producers || []].forEach((arr) =>
      arr.forEach((p) => { if (p?.file) tryDeleteCloudinaryUrl(p.file); })
    );

    if (m.latestTrailer) {
      [
        ...(m.latestTrailer.directors || []),
        ...(m.latestTrailer.producers || []),
        ...(m.latestTrailer.singers   || []),
      ].forEach((p) => { if (p?.file) tryDeleteCloudinaryUrl(p.file); });
    }

    await Movie.findByIdAndDelete(id);
    return res.json({ success: true, message: "Movie deleted successfully" });
  } catch (err) {
    console.error("Delete movie error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export default { createMovie, getMovies, getMovieById, deleteMovie };
