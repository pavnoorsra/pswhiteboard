// Whiteboard.jsx
import React, { useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { database } from "../firebase";
import { ref, push, onChildAdded } from "firebase/database";

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const { roomID } = useParams();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Set responsive canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth - 20;   // small margin
      canvas.height = window.innerHeight - 100; // leave space for UI
    };
    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    let drawing = false;
    let current = { x: 0, y: 0 };

    // Listen for lines added in Firebase
    const roomRef = ref(database, `rooms/${roomID}/lines`);
    onChildAdded(roomRef, (snapshot) => {
      const line = snapshot.val();
      if (line) drawLine(line, false);
    });

    // Draw line on canvas
    const drawLine = (line, emit = true) => {
      const { x0, y0, x1, y1, color } = line;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.closePath();

      if (!emit) return;
      push(ref(database, `rooms/${roomID}/lines`), line);
    };

    // Mouse events
    const onMouseDown = (e) => {
      drawing = true;
      current.x = e.offsetX;
      current.y = e.offsetY;
    };

    const onMouseMove = (e) => {
      if (!drawing) return;

      const x = e.offsetX;
      const y = e.offsetY;

      const line = { x0: current.x, y0: current.y, x1: x, y1: y, color: "black" };
      drawLine(line, true);

      current.x = x;
      current.y = y;
    };

    const onMouseUp = () => {
      drawing = false;
    };

    // Touch events
    const onTouchStart = (e) => {
      e.preventDefault();
      drawing = true;
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      current.x = touch.clientX - rect.left;
      current.y = touch.clientY - rect.top;
    };

    const onTouchMove = (e) => {
      e.preventDefault();
      if (!drawing) return;
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      const line = { x0: current.x, y0: current.y, x1: x, y1: y, color: "black" };
      drawLine(line, true);

      current.x = x;
      current.y = y;
    };

    const onTouchEnd = () => {
      drawing = false;
    };

    // Attach events
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseUp);

    canvas.addEventListener("touchstart", onTouchStart);
    canvas.addEventListener("touchmove", onTouchMove);
    canvas.addEventListener("touchend", onTouchEnd);
    canvas.addEventListener("touchcancel", onTouchEnd);

    // Cleanup
    return () => {
      window.removeEventListener("resize", setCanvasSize);

      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseUp);

      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [roomID]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        border: "2px solid black",
        marginTop: "20px",
        display: "block",
        touchAction: "none" // prevents scrolling on touch
      }}
    />
  );
};

export default Whiteboard;
