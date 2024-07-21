import React, { useEffect, useState } from 'react';
import { useSocket } from './SocketContext';
import './BuddyChat.css';

const BuddyChat = () => {
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [paired, setPaired] = useState(false);

  useEffect(() => {
    if (!socket) return;

    console.log('Connecting to server...');
    if (!socket.connected) {
      socket.connect();
    }

    socket.on('paired', () => {
      console.log('Paired with a partner.');
      setPaired(true);
    });

    socket.on('receive_message', (message) => {
      console.log('Received message:', message);
      if (message.id !== socket.id) {
        setMessages((prevMessages) => [...prevMessages, { text: message.text, sender: 'Partner' }]);
      }
    });

    socket.on('partner_disconnected', () => {
      setPaired(false);
      setMessages([]);
    });

    return () => {
      socket.off('paired');
      socket.off('receive_message');
      socket.off('partner_disconnected');
    };
  }, [socket]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const message = { text: inputValue, sender: 'You', id: socket.id };
      setMessages((prevMessages) => [...prevMessages, message]);
      console.log('Sending message:', message);
      socket.emit('send_message', message);
      setInputValue('');
    }
  };

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="buddy-chat">
      <div className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender === 'You' ? 'sent' : 'received'}`}>
            <span>{msg.text}</span>
          </div>
        ))}
      </div>
      <div className="input-container">
        <input
          type="text"
          placeholder="Type a message"
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
      <button className="video-call-button" onClick={() => window.location.href = '/buddy-video-call'}>
        Start Video Call
      </button>
      <p>Current emotion:</p>
      
    </div>
  );
};

export default BuddyChat;
