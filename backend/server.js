import express from 'express';
import cors from 'cors';
import compression from 'compression';
import 'dotenv/config';
import { connectDB } from './config/db.js';
import userRouter from './routes/userRouter.js';
import movieRouter from './routes/movieRouter.js';
import bookingRouter from './routes/bookingRouter.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(compression()); // gzip all responses
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

// ── Keep-alive ping (used by UptimeRobot / frontend warm-up) ──────────────────
app.get('/api/ping', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/auth',     userRouter);
app.use('/api/movies',   movieRouter);
app.use('/api/bookings', bookingRouter);

app.get('/', (_req, res) => res.send('API WORKING'));

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});