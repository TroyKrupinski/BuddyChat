import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from './SocketContext';
import './WaitingRoom.css';

const WaitingRoom = () => {
  const socket = useSocket();
  const [paired, setPaired] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    console.log('Connecting to server...');
    if (!socket.connected) {
      socket.connect();
      socket.emit('join', { username: 'User' });
    }

    socket.on('paired', (data) => {
      console.log('Paired with partner:', data.partner);
      setPaired(true);
      navigate('/buddy-chat');
    });

    return () => {
      socket.off('paired');
    };
  }, [socket, navigate]);

  return (
    <div className="waiting-room">
      <h2>Waiting Room</h2>
      <div className="loader"></div>
      <p>{paired ? 'Paired! Redirecting...' : 'You will be connected shortly...'}</p>
      <p>Current emotion:</p>
    </div>
  );
};

export default WaitingRoom;
