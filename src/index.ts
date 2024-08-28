import dotenv from "dotenv";
dotenv.config();

import express from "express";
import helemt from "helmet";
import mongoose from "mongoose";
import { MONGO_DB_CONNECT_URI } from "./constants/database";

const app = express();

app.use(helemt());

app.listen(5001, async () => {
  try {
    await mongoose.connect(MONGO_DB_CONNECT_URI);
    console.log("You successfully connected to MongoDB!");
  } catch (e) {
    console.log("Error connecting to database", e);
  } finally {
    await mongoose.disconnect();
  }
});
