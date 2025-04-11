import React, { useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";

const socket = io("https://rural-heavenly-printer.glitch.me");


const Whiteboard = () => {
  const canvasRef = useRef(null);
  const { roomID } = useParams();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let drawing = false;
    let current = { x: 0, y: 0 };

    socket.emit("join-room", roomID);

    const drawLine = (x0, y0, x1, y1, color, emit) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.closePath();

      if (!emit) return;

      socket.emit("drawing", {
        roomID,
        x0,
        y0,
        x1,
        y1,
        color
      });
    };

    const onMouseDown = (e) => {
      drawing = true;
      current.x = e.offsetX;
      current.y = e.offsetY;
    };

    const onMouseMove = (e) => {
      if (!drawing) return;

      const x = e.offsetX;
      const y = e.offsetY;

      drawLine(current.x, current.y, x, y, "black", true);
      current.x = x;
      current.y = y;
    };

    const onMouseUp = () => {
      if (!drawing) return;
      drawing = false;
    };

    socket.on("drawing", (data) => {
      drawLine(data.x0, data.y0, data.x1, data.y1, data.color || "black", false);
    });

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseUp);
    };
  }, [roomID]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{ border: "2px solid black", marginTop: "20px" }}
    />
  );
};

export default Whiteboard;
