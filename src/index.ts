import dotenv from "dotenv";
dotenv.config();

import express from "express";
import helemt from "helmet";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import { MONGO_DB_CONNECT_URI } from "./constants/database";

import AuthRouter from "./routes/auth";
import UserRouter from "./routes/user";
import PropertyRouter from "./routes/property";

const app = express();

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
  }),
);
app.use(passport.initialize());
app.use(passport.session());
app.use(helemt());

app.use("/auth", AuthRouter);
app.use("/users", UserRouter);
app.use("/property", PropertyRouter);

app.listen(5001, async () => {
  try {
    await mongoose.connect(MONGO_DB_CONNECT_URI);
    console.log("You successfully connected to MongoDB!");
  } catch (e) {
    console.log("Error connecting to database", e);
    await mongoose.disconnect();
  }
});
