import "dotenv/config";
import express from "express";
import cors from "cors";
import quizRouter from "./routes/quiz.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

app.use("/api/quiz", quizRouter);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
