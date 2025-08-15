// src/App.tsx
import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./modules/Dashboard";
import Journal from "./modules/Journal";

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/journal" element={<Journal />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
