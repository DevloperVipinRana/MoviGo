import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import streamifier from "streamifier";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Single multer instance using memoryStorage ───────────────────────────────
// Buffers ALL fields in one pass so req.body is fully populated before the
// controller runs. This fixes the "type saves as normal / name is empty" bug
// caused by the old sequential-multer approach consuming the stream early.
export const uploadAllFields = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
}).fields([
  { name: "poster",          maxCount: 1  },
  { name: "ltThumbnail",     maxCount: 1  },
  { name: "castFiles",       maxCount: 20 },
  { name: "directorFiles",   maxCount: 20 },
  { name: "producerFiles",   maxCount: 20 },
  { name: "ltDirectorFiles", maxCount: 20 },
  { name: "ltProducerFiles", maxCount: 20 },
  { name: "ltSingerFiles",   maxCount: 20 },
]);

// ─── Folder map: field name → Cloudinary folder ───────────────────────────────
const FOLDER_MAP = {
  poster:          "movie-booking/posters",
  ltThumbnail:     "movie-booking/thumbnails",
  castFiles:       "movie-booking/cast",
  directorFiles:   "movie-booking/directors",
  producerFiles:   "movie-booking/producers",
  ltDirectorFiles: "movie-booking/lt-directors",
  ltProducerFiles: "movie-booking/lt-producers",
  ltSingerFiles:   "movie-booking/lt-singers",
};

// ─── Upload a single buffer to Cloudinary and return its secure URL ───────────
function uploadBufferToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, transformation: [{ quality: "auto", fetch_format: "auto" }] },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// ─── Process all buffered files → Cloudinary ─────────────────────────────────
// Attaches file.cloudinaryUrl and file.path (same value) so both the new
// fileToUrl() helper and any legacy code reading file.path keep working.
export async function processUploadsToCloudinary(req) {
  if (!req.files) return;

  for (const fieldName of Object.keys(req.files)) {
    const folder = FOLDER_MAP[fieldName];
    if (!folder) continue;

    for (const file of req.files[fieldName]) {
      if (!file.buffer) continue;
      const url = await uploadBufferToCloudinary(file.buffer, folder);
      file.cloudinaryUrl = url;
      file.path          = url; // keeps legacy reads working
    }
  }
}

// ─── Delete a Cloudinary asset by public_id ───────────────────────────────────
export async function deleteFromCloudinary(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn("Cloudinary delete failed:", publicId, err?.message);
  }
}

// ─── Extract public_id from a Cloudinary URL ─────────────────────────────────
// https://res.cloudinary.com/demo/image/upload/v123/movie-booking/posters/abc.jpg
// → movie-booking/posters/abc
export function extractPublicId(url) {
  if (!url || typeof url !== "string") return null;
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export { cloudinary };
