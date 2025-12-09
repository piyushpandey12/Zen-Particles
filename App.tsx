import React, { useState, useEffect, useRef } from 'react';
import Visualizer from './components/Visualizer';
import Controls from './components/Controls';
import { ParticleShape, COLORS } from './types';
import { geminiLiveService } from './services/geminiLiveService';

function App() {
  const [shape, setShape] = useState<ParticleShape>(ParticleShape.SPHERE);
  const [color, setColor] = useState<string>(COLORS[0]);
  const [tension, setTension] = useState<number>(0.2); // Base tension
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Setup Service Callback
    geminiLiveService.setTensionCallback((level) => {
        setTension(prev => {
            // Smooth update from API
            return prev + (level - prev) * 0.5;
        });
    });

    // Mouse movement fallback if not connected
    const handleMouseMove = (e: MouseEvent) => {
        if (!isConnected) {
            // Map Y position to tension (Top of screen = 1.0, Bottom = 0.0)
            const t = 1 - Math.max(0, Math.min(1, e.clientY / window.innerHeight));
            setTension(t);
        }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isConnected]);

  const handleConnect = async () => {
    if (!process.env.API_KEY) {
        alert("API Key not found in environment. Interaction will be mouse-only.");
        return;
    }
    
    setIsConnecting(true);
    try {
        // 1. Get Camera
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
        }

        // 2. Connect to Gemini Live
        await geminiLiveService.connect();
        
        // 3. Start Streaming Frames
        if (videoRef.current) {
            geminiLiveService.startVideoStream(videoRef.current);
        }

        setIsConnected(true);
    } catch (err) {
        console.error("Connection failed", err);
        alert("Failed to connect to Gemini Live or access camera.");
    } finally {
        setIsConnecting(false);
    }
  };

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden select-none">
      {/* Hidden Video Element for capture */}
      <video 
        ref={videoRef} 
        muted 
        autoPlay 
        playsInline 
        className="fixed top-0 left-0 w-64 opacity-0 pointer-events-none" 
      />

      {/* Main Title Overlay */}
      <div className="absolute top-10 left-0 w-full text-center pointer-events-none z-10">
        <h1 className="text-4xl md:text-6xl font-thin tracking-[0.2em] text-white/90 glow-text">
          ZEN PARTICLES
        </h1>
        <p className="mt-4 text-sm md:text-base text-white/50 tracking-widest uppercase">
          {isConnected ? "Open hand to expand • Close to contract" : "Connect Camera or Move Mouse Up/Down"}
        </p>
      </div>

      {/* 3D Visualizer */}
      <Visualizer shape={shape} color={color} tension={tension} />

      {/* UI Controls */}
      <Controls
        currentShape={shape}
        onShapeChange={setShape}
        currentColor={color}
        onColorChange={setColor}
        tension={tension}
        isConnected={isConnected}
        onConnect={handleConnect}
        isConnecting={isConnecting}
      />
    </div>
  );
}

export default App;
