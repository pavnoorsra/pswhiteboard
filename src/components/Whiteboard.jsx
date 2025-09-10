// Whiteboard.jsx
import React, { useRef, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { database } from "../firebase";
import { ref, push, onChildAdded, remove } from "firebase/database";

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const { roomID } = useParams();
  const [lines, setLines] = useState([]);
  const [page, setPage] = useState("page1");

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    let drawing = false;
    let current = { x: 0, y: 0 };
    let currentStroke = [];

    const pageRef = ref(database, `rooms/${roomID}/${page}/lines`);

    onChildAdded(pageRef, (snapshot) => {
      const key = snapshot.key;
      const line = snapshot.val();
      if (line) {
        drawLine(line);
        setLines((prev) => [...prev, { ...line, key }]);
      }
    });

    const addStroke = (stroke) => {
      const lineRef = push(ref(database, `rooms/${roomID}/${page}/lines`));
      lineRef.set({ stroke });
      setLines((prev) => [...prev, { stroke, key: lineRef.key }]);
    };

    const drawLine = (lineObj) => {
      if (!lineObj.stroke) return;
      lineObj.stroke.forEach((line) => {
        const { x0, y0, x1, y1, color } = line;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        ctx.closePath();
      });
    };

    const onTouchStart = (e) => {
      e.preventDefault();
      drawing = true;
      currentStroke = [];
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

      const point = { x0: current.x, y0: current.y, x1: x, y1: y, color: "black" };
      currentStroke.push(point);

      // Draw immediately
      const ctx = canvasRef.current.getContext("2d");
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(point.x0, point.y0);
      ctx.lineTo(point.x1, point.y1);
      ctx.stroke();
      ctx.closePath();

      current.x = x;
      current.y = y;
    };

    const onTouchEnd = () => {
      drawing = false;
      if (currentStroke.length > 0) addStroke(currentStroke);
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

  // Undo last stroke
  const undoLast = () => {
    if (lines.length === 0) return;

    const lastLine = lines[lines.length - 1];
    remove(ref(database, `rooms/${roomID}/${page}/lines/${lastLine.key}`));

    const newLines = lines.slice(0, -1);
    setLines(newLines);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    newLines.forEach((l) => drawStroke(l));
  };

  const drawStroke = (lineObj) => {
    if (!lineObj.stroke) return;
    const ctx = canvasRef.current.getContext("2d");
    lineObj.stroke.forEach((line) => {
      const { x0, y0, x1, y1, color } = line;
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

  // Save as image
  const saveAsImage = () => {
    const canvas = canvasRef.current;
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    tempCtx.fillStyle = "#FFFFFF";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    tempCtx.drawImage(canvas, 0, 0);

    const link = document.createElement("a");
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = tempCanvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div>
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
