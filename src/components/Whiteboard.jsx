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

    let drawing = false;
    let current = { x: 0, y: 0 };

    // Listen for new lines added in Firebase
    const roomRef = ref(database, `rooms/${roomID}/lines`);
    onChildAdded(roomRef, (snapshot) => {
      const line = snapshot.val();
      if (line) drawLine(line, false);
    });

    // Function to draw a line on canvas
    const drawLine = (line, emit = true) => {
      const { x0, y0, x1, y1, color } = line;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.closePath();

      // Push to Firebase if it's your own drawing
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
      if (!drawing) return;
      drawing = false;
    };

    // Attach event listeners
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseUp);

    // Cleanup listeners
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
