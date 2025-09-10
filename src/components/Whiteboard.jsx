// Whiteboard.jsx
import React, { useRef, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const { roomID } = useParams();
  const [textMode, setTextMode] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Set canvas full screen
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    let drawing = false;
    let current = { x: 0, y: 0 };

    const onTouchStart = (e) => {
      e.preventDefault();
      if (textMode) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        const text = prompt("Enter text:");
        if (!text) { setTextMode(false); return; }

        const sizeStr = prompt("Enter font size (e.g., 20):", "20");
        const fontSize = sizeStr ? parseInt(sizeStr) : 20;

        ctx.fillStyle = "black";
        ctx.font = `${fontSize}px Arial`;
        ctx.fillText(text, x, y);

        setTextMode(false); // exit text mode
        return;
      }

      // Start drawing
      drawing = true;
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      current.x = touch.clientX - rect.left;
      current.y = touch.clientY - rect.top;
    };

    const onTouchMove = (e) => {
      e.preventDefault();
      if (!drawing || textMode) return;
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(current.x, current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.closePath();

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
  }, [textMode]);

  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const newPage = () => clearBoard();

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
          <button style={btnStyle} onTouchStart={() => setTextMode(true)}>✏️</button>
          <span style={labelStyle}>Text</span>
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
        style={{ border: "2px solid black", display: "block", touchAction: "none" }}
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

const btnWrapperStyle = { display: "flex", flexDirection: "column", alignItems: "center" };
const labelStyle = { fontSize: "12px", marginTop: "2px", color: "#000" };

export default Whiteboard;
