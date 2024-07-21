import React from 'react';
import { Link } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">BuddyChat</div>
      <ul className="navbar-menu">
        <li className="navbar-item"><Link to="/">Home</Link></li>
        <li className="navbar-item"><Link to="/webcam-config">Webcam Config</Link></li>
        <li className="navbar-item"><Link to="/waiting-room">Buddy Chat</Link></li>
      </ul>
    </nav>
  );
}

export default Navigation;
