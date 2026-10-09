import express from "express";
import cors from "cors";
import { userRouter } from "./router/user.js";
import { zapRouter } from "./router/zap.js";
import { availableRouter } from "./router/available.js";
import { runRouter } from "./router/run.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/v1/user", userRouter);
app.use("/api/v1/zap", zapRouter);
app.use("/api/v1/available", availableRouter);
app.use("/api/v1/run", runRouter);

app.listen(3001, () => {
    console.log("Server is running on port 3001");
});