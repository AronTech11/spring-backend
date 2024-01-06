import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { PORT, mongoDBURL } from './config.js';
import authRouter from './route/auth.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

mongoose.set('strictQuery', false);

app.get('/', (req, res) => {
  res.send('Server is running');
});

mongoose
  .connect(mongoDBURL)
  .then(() => {
    console.log('Connected to Database');
    app.listen(PORT, () => {
      console.log('Server is running at port : ' + PORT);
    });
  })
  .catch((err) => console.log('Error connecting to database:', err));

// Define your user schema and model here...


//Middleware
app.use('/API', authRouter);
