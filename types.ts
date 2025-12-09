export enum ParticleShape {
  SPHERE = 'Sphere',
  HEART = 'Heart',
  FLOWER = 'Flower',
  SATURN = 'Saturn',
  BUDDHA = 'Buddha',
  FIREWORKS = 'Fireworks',
}

export interface AppState {
  currentShape: ParticleShape;
  color: string;
  tension: number; // 0.0 to 1.0
  isConnected: boolean;
  isStreaming: boolean;
}

export const COLORS = [
  '#00ffff', // Cyan
  '#ff00ff', // Magenta
  '#ffff00', // Yellow
  '#ff4444', // Red
  '#44ff44', // Green
  '#4444ff', // Blue
  '#ffffff', // White
  '#ffaa00', // Orange
];
