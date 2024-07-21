import React from 'react';
import './Notification.css';

const Notification = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="notification">
      <p>{message}</p>
      <div className="notification-buttons">
        <button onClick={onConfirm}>Yes</button>
        <button onClick={onCancel}>No</button>
      </div>
    </div>
  );
};

export default Notification;
