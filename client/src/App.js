import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GamePage from './components/Game/GamePage';
import AdminPage from './components/Admin/AdminPage';
import ClasificatoriasPresala from './components/presala/clasificatoriaPresala';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<GamePage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/presala" element={<div className="presala-container"><ClasificatoriasPresala /></div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;