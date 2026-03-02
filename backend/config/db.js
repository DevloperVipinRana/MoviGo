import mongoose from 'mongoose';

export const connectDB = async () => {
    await mongoose.connect('mongodb+srv://vipinranavip97_db_user:MoviGo12345@cluster0.rvfknmf.mongodb.net/MoviGo')
    .then(()=> console.log('DB CONNECTED'))
}