// Whiteboard.jsx
import React, { useRef, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { database } from "../firebase";
import { ref, push, onChildAdded, remove, set } from "firebase/database";

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const { roomID } = useParams();
  const [lines, setLines] = useState([]);
  const [page, setPage] = useState("page1");

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Full phone screen canvas
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    let drawing = false;
    let current = { x: 0, y: 0 };

    // Listen for lines from Firebase
    const pageRef = ref(database, `rooms/${roomID}/${page}/lines`);
    onChildAdded(pageRef, (snapshot) => {
      const key = snapshot.key;
      const line = snapshot.val();
      if (line) {
        drawLine(line, false);
        setLines((prev) => [...prev, { ...line, key }]);
      }
    });

    const addLine = (line) => {
      const lineRef = push(ref(database, `rooms/${roomID}/${page}/lines`));
      lineRef.set(line);
      setLines((prev) => [...prev, { ...line, key: lineRef.key }]);
    };

    const drawLine = (line, emit = true) => {
      const { x0, y0, x1, y1, color } = line;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.closePath();

      if (emit) addLine(line);
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

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);
    canvas.addEventListener("touchcancel", onTouchEnd);

    return () => {
      window.removeEventListener("resize", setCanvasSize);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [roomID, page]);

  // Clear all
  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    remove(ref(database, `rooms/${roomID}/${page}/lines`));
    setLines([]);
  };

  // Undo last line
  const undoLast = () => {
    if (lines.length === 0) return;

    const lastLine = lines[lines.length - 1];
    remove(ref(database, `rooms/${roomID}/${page}/lines/${lastLine.key}`));

    const newLines = lines.slice(0, -1);
    setLines(newLines);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    newLines.forEach((l) => {
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

  // New Page
  const newPage = () => {
    const newPageID = `page${Date.now()}`;
    setPage(newPageID);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setLines([]);
  };

  // Save as image with white background
  const saveAsImage = () => {
    const canvas = canvasRef.current;
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    // Fill background white
    tempCtx.fillStyle = "#FFFFFF";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw original canvas on top
    tempCtx.drawImage(canvas, 0, 0);

    // Download
    const link = document.createElement("a");
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = tempCanvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div>
      {/* Floating buttons with labels */}
      <div
        style={{
          position: "fixed",
          top: 10,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "20px",
          zIndex: 1000,
        }}
      >
        <div style={btnWrapperStyle}>
          <button style={btnStyle} onTouchStart={clearBoard}>🧹</button>
          <span style={labelStyle}>Clear</span>
        </div>
        <div style={btnWrapperStyle}>
          <button style={btnStyle} onTouchStart={undoLast}>↩️</button>
          <span style={labelStyle}>Undo</span>
        </div>
        <div style={btnWrapperStyle}>
          <button style={btnStyle} onTouchStart={newPage}>➕</button>
          <span style={labelStyle}>New Page</span>
        </div>
        <div style={btnWrapperStyle}>
          <button style={btnStyle} onTouchStart={saveAsImage}>💾</button>
          <span style={labelStyle}>Save</span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        style={{
          border: "2px solid black",
          display: "block",
          touchAction: "none",
        }}
      />
    </div>
  );
};

// Styles
const btnStyle = {
  width: "50px",
  height: "50px",
  fontSize: "24px",
  borderRadius: "50%",
  border: "1px solid #444",
  background: "#fff",
  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
};

const btnWrapperStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const labelStyle = {
  fontSize: "12px",
  marginTop: "2px",
  color: "#000",
};

export default Whiteboard;
