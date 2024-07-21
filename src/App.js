import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './components/HomePage';
import WebcamConfig from './components/WebcamConfig';
import WaitingRoom from './components/WaitingRoom';
import BuddyChat from './components/BuddyChat';
import BuddyVideoCall from './components/BuddyVideoCall';
import Navigation from './components/Navigation';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/webcam-config" element={<WebcamConfig />} />
          <Route path="/waiting-room" element={<WaitingRoom />} />
          <Route path="/buddy-chat" element={<BuddyChat />} />
          <Route path="/buddy-video-call" element={<BuddyVideoCall />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
