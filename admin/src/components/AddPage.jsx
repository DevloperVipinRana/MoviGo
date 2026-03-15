import React, { useEffect, useRef, useState } from "react";
import {
  addMoviePageStyles,
  addMoviePageCustomStyles,
} from "../assets/dummyStyles";
import axios from 'axios'

const API_HOST = "http://localhost:5000";

const AddPage = () => {
  // form state
  const [movieName, setMovieName] = useState("");
  const [categories, setCategories] = useState([]);
  const [poster, setPoster] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const [trailerUrl, setTrailerUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [rating, setRating] = useState(7.5);
  const [duration, setDuration] = useState(120);
  const [slots, setSlots] = useState([
    { id: Date.now(), date: "", time: "", ampm: "AM" },
  ]);
  const [castImages, setCastImages] = useState([]);
  const [directorImages, setDirectorImages] = useState([]);
  const [producerImages, setProducerImages] = useState([]);
  const [story, setStory] = useState("");
  const [movieType, setMovieType] = useState("normal");

  //   seats
  const [standardSeatPrice, setStandardSeatPrice] = useState(0);
  const [reclinerSeatPrice, setReclinerSeatPrice] = useState(0);

  //   latesttrailers
  const [ltDurationHours, setLtDurationHours] = useState(1);
  const [ltDurationMinutes, setLtDurationMinutes] = useState(30);
  const [ltYear, setLtYear] = useState(new Date().getFullYear());
  const [ltDescription, setLtDescription] = useState("");
  const [ltThumbnail, setLtThumbnail] = useState(null);
  const [ltThumbnailPreview, setLtThumbnailPreview] = useState(null);
  const [ltVideoUrl, setLtVideoUrl] = useState("");
  const [ltDirectorImages, setLtDirectorImages] = useState([]);
  const [ltProducerImages, setLtProducerImages] = useState([]);
  const [ltSingerImages, setLtSingerImages] = useState([]);

  const fileInputRef = useRef();

  // duration hours/minutes local state for normal & featured
  const [durationHours, setDurationHours] = useState(Math.floor(duration / 60));
  const [durationMinutes, setDurationMinutes] = useState(duration % 60);

  // auditorium state & available options
  const availableAuditoriums = ["Audi 1", "Audi 2", "Audi 3"];
  const [auditorium, setAuditorium] = useState("Audi 1");
  const [customAuditorium, setCustomAuditorium] = useState("");

  // uploading indicator
  const [isUploading, setIsUploading] = useState(false);

  //   to calculate total
  useEffect(()=>{
    const total = (Number(durationHours) || 0) *60 + (Number(durationMinutes) || 0)
    setDuration(total);
  }, [durationHours, durationMinutes]);

  const availableCategories = ["Action", "Horror", "Comedy", "Adventure"];

  function toggleCategory(cat) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  // file helpers
  const handlePosterChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setPoster(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPosterPreview(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const handleLtThumbnailChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setLtThumbnail(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLtThumbnailPreview(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  // generalized helpers for reading multiple files to preview with optional meta
  const readFilesToPreviewsWithMeta = (files, setter, metaType = null) => {
    const arr = Array.from(files);
    const readers = arr.map((file) => {
      return new Promise((res) => {
        const r = new FileReader();
        r.onload = (e) =>
          res({
            file,
            preview: e.target.result,
            ...(metaType === "name" ? { name: "" } : {}),
            ...(metaType === "nameRole" ? { name: "", role: "" } : {}),
          });
        r.readAsDataURL(file);
      });
    });
    Promise.all(readers).then((items) => {
      setter((prev) => [...prev, ...items]);
    });
  };

  const handleMultipleFiles = (e, setter, metaType = null) => {
    if (!e.target.files) return;
    readFilesToPreviewsWithMeta(e.target.files, setter, metaType);
    e.target.value = null;
  }; //can see multi imgs renders

  const readFilesToNamedPreviews = (files, setter) => {
    const arr = Array.from(files);
    const readers = arr.map((file) => {
      return new Promise((res) => {
        const r = new FileReader();
        r.onload = (e) => res({ file, preview: e.target.result, name: "" });
        r.readAsDataURL(file);
      });
    });
    Promise.all(readers).then((items) => {
      setter((prev) => [...prev, ...items]);
    });
  };

  const handleMultipleNamedFiles = (e, setter) => {
    if (!e.target.files) return;
    readFilesToNamedPreviews(e.target.files, setter);
    e.target.value = null;
  };

  const removePreview = (id, setter) => {
    setter((prev) => prev.filter((p, idx) => idx !== id));
  }; //remove the image if picked or selected wrong

  const updateNamedItemName = (idx, setter, value) => {
    setter((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, name: value } : it))
    );
  };

  const updateMetaField = (idx, setter, field, value) => {
    setter((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it))
    );
  };

  // slots helpers add remove and update slot timings for a movie(choose date, time and am/pm for that movie)
  function addSlot() {
    setSlots((s) => [
      ...s,
      { id: Date.now() + Math.random(), date: "", time: "", ampm: "AM" },
    ]);
  }
  function removeSlot(id) {
    setSlots((s) => s.filter((slot) => slot.id !== id));
  }
  function updateSlot(id, field, value) {
    setSlots((s) =>
      s.map((slot) => (slot.id === id ? { ...slot, [field]: value } : slot))
    );
  }

  return <div></div>;
};

export default AddPage;
