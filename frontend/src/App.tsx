import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameScreen } from './screens/GameScreen';
import { LandingScreen } from './screens/LandingScreen';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<LandingScreen />} />
          <Route path="/game/:roomId" element={<GameScreen />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
