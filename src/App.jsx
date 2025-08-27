
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Calculator from "./components/Calculator";
import ScheduleCreator from "./pages/ScheduleCreator";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/schedule-creator" element={<ScheduleCreator />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
