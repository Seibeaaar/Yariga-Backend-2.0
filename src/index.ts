import express from "express";
import dotenv from "dotenv";
import helemt from "helmet";

const app = express();

dotenv.config();

app.use(helemt());

app.listen(5001, () => console.log("works"));
