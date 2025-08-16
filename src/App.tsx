// src/App.tsx
import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./modules/Dashboard";
import Journal from "./modules/Journal";
import Accounts from "./modules/Accounts";

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/accounts" element={<Accounts />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
