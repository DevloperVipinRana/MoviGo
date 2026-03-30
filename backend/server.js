import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { connectDB } from './config/db.js';
import userRouter from './routes/userRouter.js';
import movieRouter from './routes/movieRouter.js';
import path from 'path';
import bookingRouter from './routes/bookingRouter.js';

const app = express();
const port = 5000;

// MIDDLEWARES
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB
connectDB();

// Ensure uploads directory exists at runtime (important for deployed containers)
import fs from 'fs';
const uploadsPath = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// ROUTES
app.use('/uploads', express.static(uploadsPath));
app.use('/api/auth', userRouter);
app.use('/api/movies', movieRouter);
app.use('/api/bookings', bookingRouter);

app.get('/', (req, res) =>{
    res.send('API WORKING');
})

app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
})