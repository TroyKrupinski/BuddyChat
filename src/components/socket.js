import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  autoConnect: false, // Disable autoConnect to manually control connection
});

export default socket;
