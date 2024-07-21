import React from 'react';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <div className="content">
        <h1>Welcome to BuddyChat</h1>
        <p>Connect with a buddy for a chat or video call.</p>
        <button onClick={() => window.location.href = '/webcam-config'}>Get Started</button>
      </div>
    </div>
  );
}

export default HomePage;
