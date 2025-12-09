import * as THREE from 'three';
import { ParticleShape } from './types';

export const PARTICLE_COUNT = 3000;

// Helper to generate random point in sphere
const randomInSphere = (radius: number) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
};

export const generateShapePositions = (shape: ParticleShape, count: number): Float32Array => {
  const positions = new Float32Array(count * 3);
  const tempVec = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, z = 0;

    switch (shape) {
      case ParticleShape.SPHERE: {
        const p = randomInSphere(2);
        x = p.x; y = p.y; z = p.z;
        break;
      }
      case ParticleShape.HEART: {
        // Heart surface equation approximation
        const t = Math.random() * Math.PI * 2; // theta
        const u = Math.random() * Math.PI; // phi (roughly)
        // Better heart parametric
        // x = 16sin^3(t)
        // y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
        // Extrude slightly in Z for 3D volume
        const ht = Math.random() * Math.PI * 2;
        const hr = Math.sqrt(Math.random()) * 0.1; // thickness
        x = (16 * Math.pow(Math.sin(ht), 3)) * 0.15;
        y = (13 * Math.cos(ht) - 5 * Math.cos(2 * ht) - 2 * Math.cos(3 * ht) - Math.cos(4 * ht)) * 0.15;
        z = (Math.random() - 0.5) * 1;
        break;
      }
      case ParticleShape.FLOWER: {
        // Rose curve 3D
        const k = 4; // Petals
        const theta = Math.random() * Math.PI * 2;
        const r = Math.cos(k * theta);
        const radius = 2;
        x = r * Math.cos(theta) * radius;
        y = r * Math.sin(theta) * radius;
        z = (Math.random() - 0.5) * 0.5;
        break;
      }
      case ParticleShape.SATURN: {
        // Planet + Rings
        if (Math.random() > 0.4) {
          // Planet
          const p = randomInSphere(1.0);
          x = p.x; y = p.y; z = p.z;
        } else {
          // Ring
          const angle = Math.random() * Math.PI * 2;
          const dist = 1.5 + Math.random() * 1.5;
          x = Math.cos(angle) * dist;
          y = (Math.random() - 0.5) * 0.1;
          z = Math.sin(angle) * dist;
        }
        break;
      }
      case ParticleShape.BUDDHA: {
        // Abstract meditation shape: Base (legs), Torso, Head
        const r = Math.random();
        if (r < 0.4) {
           // Legs (Base Oval)
           const angle = Math.random() * Math.PI * 2;
           const rad = Math.random() * 1.5;
           x = Math.cos(angle) * rad;
           y = -1.5 + Math.random() * 0.5;
           z = Math.sin(angle) * rad * 0.6;
        } else if (r < 0.8) {
           // Body (Sphere-ish)
           const p = randomInSphere(1.0);
           x = p.x * 0.8;
           y = p.y * 0.8 - 0.2;
           z = p.z * 0.8;
        } else {
           // Head
           const p = randomInSphere(0.6);
           x = p.x * 0.6;
           y = p.y * 0.6 + 1.0;
           z = p.z * 0.6;
        }
        break;
      }
      case ParticleShape.FIREWORKS: {
         // Explosion from center
         const p = randomInSphere(0.2);
         // Storing velocity direction as position for now, expanded by tension later
         const dir = new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize();
         const dist = Math.random() * 3;
         x = dir.x * dist;
         y = dir.y * dist;
         z = dir.z * dist;
         break;
      }
    }

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  return positions;
};
