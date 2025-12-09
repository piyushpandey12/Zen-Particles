import React from 'react';
import { ParticleShape, COLORS } from '../types';
import { Heart, Flower, Globe, Zap, Circle, Smile } from 'lucide-react';

interface ControlsProps {
  currentShape: ParticleShape;
  onShapeChange: (shape: ParticleShape) => void;
  currentColor: string;
  onColorChange: (color: string) => void;
  tension: number;
  isConnected: boolean;
  onConnect: () => void;
  isConnecting: boolean;
}

const SHAPE_ICONS: Record<ParticleShape, React.ReactNode> = {
  [ParticleShape.HEART]: <Heart size={20} />,
  [ParticleShape.FLOWER]: <Flower size={20} />,
  [ParticleShape.SATURN]: <Circle size={20} className="rotate-45" />, // Approximation
  [ParticleShape.BUDDHA]: <Smile size={20} />, // Approximation
  [ParticleShape.FIREWORKS]: <Zap size={20} />,
  [ParticleShape.SPHERE]: <Globe size={20} />,
};

const Controls: React.FC<ControlsProps> = ({
  currentShape,
  onShapeChange,
  currentColor,
  onColorChange,
  tension,
  isConnected,
  onConnect,
  isConnecting
}) => {
  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-[90%] max-w-2xl bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-6 animate-fade-in-up">
      
      {/* Top Bar: Connection & Tension */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onConnect}
          disabled={isConnected || isConnecting}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all
            ${isConnected 
              ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
              : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'}
          `}
        >
          {isConnected ? 'Gemini Live Active' : isConnecting ? 'Connecting...' : 'Connect Camera'}
        </button>

        {/* Tension Bar */}
        <div className="flex-1 flex items-center gap-3">
            <span className="text-xs text-white/50 uppercase">Tension</span>
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
                    style={{ width: `${tension * 100}%` }}
                />
            </div>
            <span className="text-xs text-white/70 font-mono">{(tension * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Shape Selectors */}
      <div className="flex justify-between items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
        {Object.values(ParticleShape).map((shape) => (
          <button
            key={shape}
            onClick={() => onShapeChange(shape)}
            className={`
              flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 min-w-[70px]
              ${currentShape === shape 
                ? 'bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.2)] scale-105' 
                : 'bg-transparent hover:bg-white/5 opacity-60 hover:opacity-100'}
            `}
          >
            <div className={`${currentShape === shape ? 'animate-pulse text-white' : 'text-white/80'}`}>
              {SHAPE_ICONS[shape]}
            </div>
            <span className="text-[10px] font-medium tracking-wide">{shape}</span>
          </button>
        ))}
      </div>

      {/* Color Picker */}
      <div className="flex justify-center gap-3">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onColorChange(c)}
            className={`
              w-6 h-6 rounded-full transition-transform duration-300 border border-white/10
              ${currentColor === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-black' : 'hover:scale-110'}
            `}
            style={{ backgroundColor: c, boxShadow: currentColor === c ? `0 0 10px ${c}` : 'none' }}
            aria-label={`Select color ${c}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Controls;
