import express from "express";
import { config } from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";

import chatRoutes from "./routers/chatRoutes.js";
import userRoutes from "./routers/userRoutes.js";

export const app = express();

config({ path: "./.env" });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow *.vercel.app or localhost:5173
      if (
        origin &&
        (origin.match(/^https?:\/\/(.*\.)?vercel\.app$/) ||
          origin === "http://localhost:5173")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);
app.use(cookieParser());

const server = http.createServer(app);
const io = new Server(server);

app.get("/", (_req, res) => {
  res.send("Server is working fine");
});

app.use("/api/chat", chatRoutes);
app.use("/api/user", userRoutes);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  const lobby = "lobby";
  socket.join(lobby);

  console.log("User joined lobby:", socket.id);

  socket.on("publicMessage", (data) => {
    io.to(lobby).emit("publicMessage", data);
  });

  socket.on("joinRoom", (room) => {
    socket.join(room);
    console.log("User joined room:", room);
  });

  socket.on("privateMessage", (data) => {
    const { chatId, message } = data;
    io.to(chatId).emit("privateMessage", message);
  });

  //socket.on("message", (data) => {
  //  io.emit("message", data); 
  //});


  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

