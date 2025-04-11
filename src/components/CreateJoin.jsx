import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CreateJoin = () => {
  const [roomID, setRoomID] = useState("");
  const navigate = useNavigate();

  const createRoom = () => {
    if (roomID.length === 6) {
      navigate(`/room/${roomID.toUpperCase()}`);
    } else {
      alert("Enter a 6-character room code to create the room.");
    }
  };

  const joinRoom = () => {
    if (roomID.length === 6) {
      navigate(`/room/${roomID.toUpperCase()}`);
    } else {
      alert("Enter a valid 6-character room code to join.");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>PS's Whiteboard Pro</h1>

      <input
        placeholder="Enter 6-character Room Code"
        value={roomID}
        onChange={(e) => setRoomID(e.target.value)}
        style={{ padding: "10px", fontSize: "18px", textTransform: "uppercase" }}
        maxLength={6}
      />

      <div style={{ marginTop: "20px" }}>
        <button
          onClick={createRoom}
          style={{ fontSize: "20px", padding: "10px 30px", marginRight: "10px" }}
        >
          Create Room
        </button>

        <button
          onClick={joinRoom}
          style={{ fontSize: "20px", padding: "10px 30px" }}
        >
          Join Room
        </button>
      </div>
    </div>
  );
};

export default CreateJoin;
