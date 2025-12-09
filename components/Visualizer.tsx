import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { ParticleShape } from '../types';
import { generateShapePositions, PARTICLE_COUNT } from '../constants';

interface VisualizerProps {
  shape: ParticleShape;
  color: string;
  tension: number;
}

const Visualizer: React.FC<VisualizerProps> = ({ shape, color, tension }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Store current and target positions
  const currentPositionsRef = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT * 3));
  const targetPositionsRef = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT * 3));
  
  // Initialize Scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.05);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Particles
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Initial random positions
    const initialPos = generateShapePositions(ParticleShape.SPHERE, PARTICLE_COUNT);
    currentPositionsRef.current.set(initialPos);
    targetPositionsRef.current.set(initialPos);
    geometry.attributes.position.set(currentPositionsRef.current);

    // Material
    const material = new THREE.PointsMaterial({
      color: new THREE.Color(color),
      size: 0.05,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = particles;

    // Cursor/Mouse Light (Soft glow following interaction, optional, simulated by camera movement here)
    
    // Resize Handler
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
      geometry.dispose();
      material.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Shape Targets
  useEffect(() => {
    targetPositionsRef.current = generateShapePositions(shape, PARTICLE_COUNT);
  }, [shape]);

  // Update Color
  useEffect(() => {
    if (particlesRef.current) {
      (particlesRef.current.material as THREE.PointsMaterial).color.set(color);
    }
  }, [color]);

  // Animation Loop
  useEffect(() => {
    const animate = () => {
      if (!sceneRef.current || !cameraRef.current || !rendererRef.current || !particlesRef.current) return;

      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      const current = currentPositionsRef.current;
      const target = targetPositionsRef.current;
      
      // Interpolation speed
      const lerpSpeed = 0.05;
      
      // Expansion factor based on tension (0.0 to 1.0)
      // We expand outwards from center
      const expansion = 1 + (tension * 2.0); // 1x to 3x size

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        
        // Lerp towards target shape
        current[i3] += (target[i3] - current[i3]) * lerpSpeed;
        current[i3+1] += (target[i3+1] - current[i3+1]) * lerpSpeed;
        current[i3+2] += (target[i3+2] - current[i3+2]) * lerpSpeed;

        // Apply Expansion + Rotation
        // We calculate the final render position by applying expansion to the base shape position
        // Also add a gentle rotation
        const x = current[i3];
        const y = current[i3+1];
        const z = current[i3+2];

        // Simple rotation around Y axis
        const time = Date.now() * 0.0002;
        const cosT = Math.cos(time);
        const sinT = Math.sin(time);
        
        const rotX = x * cosT - z * sinT;
        const rotZ = x * sinT + z * cosT;

        positions[i3] = rotX * expansion;
        positions[i3+1] = y * expansion;
        positions[i3+2] = rotZ * expansion;
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true;
      
      // Pulse size based on tension
      (particlesRef.current.material as THREE.PointsMaterial).size = 0.05 + (tension * 0.05);

      rendererRef.current.render(sceneRef.current, cameraRef.current);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [tension]); // Re-bind animate if tension logic changes fundamentally, though we use ref for values usually.
  // Actually, tension is used inside loop. To be safe/clean in React:
  // We should use a Ref for tension to avoid re-creating the loop, or trust that re-creating the loop is cheap enough.
  // Let's use a Ref for tension to avoid loop jank.
  
  const tensionRef = useRef(tension);
  useEffect(() => { tensionRef.current = tension; }, [tension]);

  // Re-write loop to use refs only
  useEffect(() => {
    const animate = () => {
      if (!sceneRef.current || !cameraRef.current || !rendererRef.current || !particlesRef.current) return;
      
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      const current = currentPositionsRef.current;
      const target = targetPositionsRef.current;
      const t = tensionRef.current;
      const lerpSpeed = 0.03;
      const expansion = 1 + (t * 1.5); 

      const time = Date.now() * 0.0005;
      const cosT = Math.cos(time);
      const sinT = Math.sin(time);

      // Wobble factor for "breathing"
      const breathe = Math.sin(Date.now() * 0.002) * 0.1 + 1;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        
        // Move base position
        current[i3] += (target[i3] - current[i3]) * lerpSpeed;
        current[i3+1] += (target[i3+1] - current[i3+1]) * lerpSpeed;
        current[i3+2] += (target[i3+2] - current[i3+2]) * lerpSpeed;

        const x = current[i3];
        const y = current[i3+1];
        const z = current[i3+2];

        // Rotate
        const rx = x * cosT - z * sinT;
        const rz = x * sinT + z * cosT;

        // Apply
        positions[i3] = rx * expansion * breathe;
        positions[i3+1] = y * expansion * breathe;
        positions[i3+2] = rz * expansion * breathe;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
      (particlesRef.current.material as THREE.PointsMaterial).size = 0.03 + (t * 0.08);

      rendererRef.current.render(sceneRef.current, cameraRef.current);
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    
    // Stop previous loop
    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameRef.current);
  }, []); // Run once, depend on refs

  return <div ref={containerRef} className="absolute inset-0 -z-10" />;
};

export default Visualizer;
