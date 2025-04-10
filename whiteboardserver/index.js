const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // IMPORTANT!
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomID) => {
    socket.join(roomID);
    console.log(`${socket.id} joined room ${roomID}`);
  });

  socket.on("drawing", ({ roomID, x0, y0, x1, y1, color }) => {
    socket.to(roomID).emit("drawing", { x0, y0, x1, y1, color });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});
