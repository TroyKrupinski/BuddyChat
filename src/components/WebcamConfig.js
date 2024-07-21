import React, { useState, useEffect, useRef } from 'react';
import './WebcamConfig.css';

const WebcamConfig = () => {
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
  const videoRef = useRef(null);
  const audioMeterRef = useRef(null);
  const audioContextRef = useRef(null);
  const meterRef = useRef(null);

  useEffect(() => {
    async function getDevices() {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
      const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
      setVideoDevices(videoInputDevices);
      setAudioDevices(audioInputDevices);
      if (videoInputDevices.length > 0) setSelectedVideoDevice(videoInputDevices[0].deviceId);
      if (audioInputDevices.length > 0) setSelectedAudioDevice(audioInputDevices[0].deviceId);
    }
    getDevices();
  }, []);

  useEffect(() => {
    if (selectedVideoDevice) {
      navigator.mediaDevices.getUserMedia({ video: { deviceId: selectedVideoDevice } })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(console.error);
    }
  }, [selectedVideoDevice]);

  useEffect(() => {
    if (selectedAudioDevice) {
      navigator.mediaDevices.getUserMedia({ audio: { deviceId: selectedAudioDevice } })
        .then(stream => {
          if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
          }
          const source = audioContextRef.current.createMediaStreamSource(stream);
          if (!meterRef.current) {
            meterRef.current = createAudioMeter(audioContextRef.current);
            source.connect(meterRef.current);
          }
        })
        .catch(console.error);
    }
  }, [selectedAudioDevice]);

  const createAudioMeter = (audioContext) => {
    const processor = audioContext.createScriptProcessor(512);
    processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      const max = Math.max(...input.map(Math.abs));
      if (audioMeterRef.current) {
        audioMeterRef.current.value = max;
      }
    };
    processor.connect(audioContext.destination);
    return processor;
  };

  return (
    <div className="webcam-config">
      <h2>Configure Your Webcam and Microphone</h2>
      <div className="device-selection">
        <div>
          <label htmlFor="video-devices">Select Video Device:</label>
          <select id="video-devices" onChange={(e) => setSelectedVideoDevice(e.target.value)} value={selectedVideoDevice}>
            {videoDevices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${device.deviceId}`}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="audio-devices">Select Audio Device:</label>
          <select id="audio-devices" onChange={(e) => setSelectedAudioDevice(e.target.value)} value={selectedAudioDevice}>
            {audioDevices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>{device.label || `Microphone ${device.deviceId}`}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="media-preview">
        <video ref={videoRef} autoPlay playsInline className="video-preview"></video>
        <div className="audio-meter-container">
          <label htmlFor="audio-meter">Microphone Volume:</label>
          <progress id="audio-meter" ref={audioMeterRef} max="1" className="audio-meter"></progress>
        </div>
      </div>
      <button onClick={() => window.location.href = '/waiting-room'}>Next</button>
    </div>
  );
}

export default WebcamConfig;
