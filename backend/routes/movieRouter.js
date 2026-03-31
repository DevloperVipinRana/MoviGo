import express from "express";
import { uploadAllFields, processUploadsToCloudinary } from "../config/cloudinary.js";
import { createMovie, deleteMovie, getMovieById, getMovies } from "../controllers/moviesController.js";

const movieRouter = express.Router();

async function handleUpload(req, res, next) {
  uploadAllFields(req, res, async (multerErr) => {
    if (multerErr) {
      console.error("Multer error:", multerErr?.message);
      return res.status(400).json({ success: false, message: multerErr.message });
    }
    try {
      await processUploadsToCloudinary(req);
      next();
    } catch (err) {
      console.error("Cloudinary processing error:", err?.message);
      return res.status(500).json({
        success: false,
        message: "Image upload to Cloudinary failed: " + (err?.message || "unknown"),
      });
    }
  });
}

movieRouter.post("/",      handleUpload, createMovie);
movieRouter.get("/",       getMovies);
movieRouter.get("/:id",    getMovieById);
movieRouter.delete("/:id", deleteMovie);

export default movieRouter;
