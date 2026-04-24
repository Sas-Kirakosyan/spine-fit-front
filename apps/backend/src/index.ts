import "dotenv/config";
import express from "express";
import cors from "cors";
import quizRouter from "./routes/quiz.js";
import chatRouter from "./routes/chat.js";

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = [
  "http://localhost:3000",
  "https://spinefit.app",
  "https://www.spinefit.app",
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.options("*", cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json());

app.use("/api/quiz", quizRouter);
app.use("/api/chat", chatRouter);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
