import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CreateJoin from "./components/CreateJoin";
import Whiteboard from "./components/Whiteboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CreateJoin />} />
        <Route path="/room/:roomID" element={<Whiteboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
