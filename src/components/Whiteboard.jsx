// Whiteboard.jsx
import React, { useRef, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { database } from "../firebase";
import { ref, push, onChildAdded, remove, set } from "firebase/database";

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const { roomID } = useParams();
  const [lines, setLines] = useState([]);
  const [page, setPage] = useState("page1"); // default page

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // 📱 Full phone screen canvas
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 150; // leave space for buttons
    };
    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    let drawing = false;
    let current = { x: 0, y: 0 };

    // 🔄 Listen for lines in Firebase
    const pageRef = ref(database, `rooms/${roomID}/${page}/lines`);
    onChildAdded(pageRef, (snapshot) => {
      const line = snapshot.val();
      if (line) {
        drawLine(line, false);
        setLines((prev) => [...prev, line]);
      }
    });

    // ✏️ Draw line
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
      push(ref(database, `rooms/${roomID}/${page}/lines`), line);
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
      setLines((prev) => [...prev, line]);

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
      setLines((prev) => [...prev, line]);

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
  }, [roomID, page]);

  // 🧹 Clear all
  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    remove(ref(database, `rooms/${roomID}/${page}/lines`));
    setLines([]);
  };

  // ↩️ Undo last
  const undoLast = () => {
    if (lines.length === 0) return;
    const newLines = lines.slice(0, -1);
    setLines(newLines);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    remove(ref(database, `rooms/${roomID}/${page}/lines`));
    newLines.forEach((l) => {
      push(ref(database, `rooms/${roomID}/${page}/lines`), l);
      const { x0, y0, x1, y1, color } = l;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.closePath();
    });
  };

  // ➕ New Page
  const newPage = () => {
    const newPageID = `page${Date.now()}`;
    setPage(newPageID);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setLines([]);
  };

  // 💾 Save as image
  const saveAsImage = () => {
    const link = document.createElement("a");
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  return (
    <div>
      {/* Buttons */}
      <div style={{ display: "flex", gap: "10px", margin: "10px" }}>
        <button onClick={clearBoard}>🧹</button>
        <button onClick={undoLast}>↩️</button>
        <button onClick={newPage}>➕</button>
        <button onClick={saveAsImage}>💾</button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          border: "2px solid black",
          display: "block",
          touchAction: "none", // prevent page scroll while drawing
        }}
      />
    </div>
  );
};

export default Whiteboard;
