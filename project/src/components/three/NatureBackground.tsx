import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const NatureBackground: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Primary decorative crystal - Emerald green
    const crystalGeometry = new THREE.IcosahedronGeometry(2, 1);
    const crystalMaterial = new THREE.MeshStandardMaterial({
      color: 0x10b981, // Emerald
      emissive: 0x065f46, // Dark forest green glow
      roughness: 0.2,
      metalness: 0.15,
      transparent: true,
      opacity: 0.2,
      wireframe: true,
    });
    const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
    scene.add(crystal);

    // Secondary smaller crystal - Fresh green
    const smallCrystalGeometry = new THREE.OctahedronGeometry(0.8, 0);
    const smallCrystalMaterial = new THREE.MeshStandardMaterial({
      color: 0x22c55e, // Fresh green
      emissive: 0x14532d,
      roughness: 0.3,
      metalness: 0.1,
      transparent: true,
      opacity: 0.15,
      wireframe: true,
    });
    const smallCrystal = new THREE.Mesh(smallCrystalGeometry, smallCrystalMaterial);
    smallCrystal.position.set(3, 2, -2);
    scene.add(smallCrystal);

    // Third accent crystal - Teal
    const accentCrystalGeometry = new THREE.TetrahedronGeometry(0.6, 0);
    const accentCrystalMaterial = new THREE.MeshStandardMaterial({
      color: 0x14b8a6, // Teal
      emissive: 0x0f766e,
      roughness: 0.25,
      metalness: 0.1,
      transparent: true,
      opacity: 0.12,
      wireframe: true,
    });
    const accentCrystal = new THREE.Mesh(accentCrystalGeometry, accentCrystalMaterial);
    accentCrystal.position.set(-2.5, -1.5, -1);
    scene.add(accentCrystal);

    // Soft ambient light with green tint
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Point lights for depth
    const pointLight1 = new THREE.PointLight(0x10b981, 0.6);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x22c55e, 0.4);
    pointLight2.position.set(-5, -3, 3);
    scene.add(pointLight2);

    // Particle system (floating leaves/spores)
    const particlesCount = 600;
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);
    const sizes = new Float32Array(particlesCount);

    // Green color palette for particles
    const greenColors = [
      new THREE.Color(0x10b981), // Emerald
      new THREE.Color(0x22c55e), // Green
      new THREE.Color(0x4ade80), // Light green
      new THREE.Color(0x34d399), // Bright emerald
      new THREE.Color(0x14b8a6), // Teal
      new THREE.Color(0x84cc16), // Lime
    ];

    for (let i = 0; i < particlesCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 35;

      const color = greenColors[Math.floor(Math.random() * greenColors.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 0.15 + 0.05;
    }

    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.12,
      transparent: true,
      opacity: 0.5,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Animation variables
    let time = 0;

    // Animation loop
    let frameId: number;
    const animate = () => {
      time += 0.01;

      // Main crystal rotation with gentle wobble
      crystal.rotation.x += 0.001;
      crystal.rotation.y += 0.002;
      crystal.position.y = Math.sin(time * 0.5) * 0.1;

      // Small crystal counter-rotation
      smallCrystal.rotation.x -= 0.002;
      smallCrystal.rotation.y += 0.001;
      smallCrystal.position.y = 2 + Math.sin(time * 0.7) * 0.15;

      // Accent crystal movement
      accentCrystal.rotation.x += 0.003;
      accentCrystal.rotation.z += 0.001;
      accentCrystal.position.y = -1.5 + Math.cos(time * 0.6) * 0.12;

      // Particle rotation
      particles.rotation.y += 0.0003;
      particles.rotation.x += 0.0001;

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      const { innerWidth, innerHeight } = window;
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      mount.removeChild(renderer.domElement);
      crystalGeometry.dispose();
      crystalMaterial.dispose();
      smallCrystalGeometry.dispose();
      smallCrystalMaterial.dispose();
      accentCrystalGeometry.dispose();
      accentCrystalMaterial.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
    };
  }, []);

  return <div ref={mountRef} className="fixed inset-0 -z-10 pointer-events-none" />;
};

export default NatureBackground;
