import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import io from 'socket.io-client';
import './BuddyVideoCall.css';

const socket = io.connect('http://localhost:5000'); // Change to your server address

const BuddyVideoCall = () => {
  const [stream, setStream] = useState(null);
  const [peers, setPeers] = useState([]);
  const userVideo = useRef();
  const partnerVideo = useRef();
  const peersRef = useRef([]);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      setStream(stream);
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }

      socket.emit('join');

      socket.on('signal', (data) => {
        const peer = new Peer({
          initiator: data.initiator,
          trickle: false,
          stream: stream,
        });

        peer.on('signal', (signal) => {
          socket.emit('signal', { signal: signal, to: data.from });
        });

        peer.on('stream', (stream) => {
          if (partnerVideo.current) {
            partnerVideo.current.srcObject = stream;
          }
        });

        peer.signal(data.signal);

        peersRef.current.push({
          peerID: data.from,
          peer,
        });

        setPeers((users) => [...users, peer]);
      });
    });
  }, []);

  return (
    <div className="buddy-video-call">
      <h2>Buddy Video Call</h2>
      <div className="video-container">
        <video ref={userVideo} autoPlay muted className="video user-video"></video>
        <video ref={partnerVideo} autoPlay className="video partner-video"></video>
      </div>
      <p>Current emotion:</p>
    </div>
  );
};

export default BuddyVideoCall;
