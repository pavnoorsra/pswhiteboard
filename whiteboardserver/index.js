const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

// ✅ Enable CORS
app.use(cors());

const server = http.createServer(app);

// ✅ Setup Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins (you can replace with frontend link)
    methods: ["GET", "POST"]
  }
});

// ✅ All socket events
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

// ✅ Use dynamic port (for Render, Glitch, etc.)
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
