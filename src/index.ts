import dotenv from "dotenv";
dotenv.config();

import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { MONGO_DB_CONNECT_URI } from "./constants/database";

import AuthRouter from "./routes/auth";
import UserRouter from "./routes/user";
import PropertyRouter from "./routes/property";
import AgreementRouter from "./routes/agreement";
import NotificationRouter from "./routes/notification";
import MessageRouter from "./routes/message";
import ChatRouter from "./routes/chats";
import ReviewRouter from "./routes/review";

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
app.use(helmet());
app.use(
  cors({
    origin: "*",
  }),
);

app.use("/auth", AuthRouter);
app.use("/user", UserRouter);
app.use("/property", PropertyRouter);
app.use("/agreement", AgreementRouter);
app.use("/notification", NotificationRouter);
app.use("/message", MessageRouter);
app.use("/chat", ChatRouter);
app.use("/review", ReviewRouter);

app.listen(5001, async () => {
  try {
    await mongoose.connect(MONGO_DB_CONNECT_URI);
    console.log("You successfully connected to MongoDB!");
  } catch (e) {
    console.log("Error connecting to database", e);
    await mongoose.disconnect();
  }
});
