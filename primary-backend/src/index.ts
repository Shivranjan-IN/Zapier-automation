import "dotenv/config";
import express from "express";
import cors from "cors";
import { userRouter } from "./router/user.js";
import { zapRouter } from "./router/zap.js";
import { availableRouter } from "./router/available.js";
import { runRouter } from "./router/run.js";

const app = express();

// Allowed browser origins (comma-separated). Unset => reflect any origin (dev).
const allowedOrigins = (process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true
}));
app.use(express.json());

app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "backend" });
});

app.use("/api/v1/user", userRouter);
app.use("/api/v1/zap", zapRouter);
app.use("/api/v1/available", availableRouter);
app.use("/api/v1/run", runRouter);

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});