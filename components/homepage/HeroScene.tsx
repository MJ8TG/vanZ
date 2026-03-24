"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Trail, Line, Sphere, Box, Cylinder } from "@react-three/drei";
import * as THREE from "three";

// --- Data & Geometry ---
// Abstract map of Tunisia (roughly centered at 0, 0, 0, scaled to fit screen)
const mapOutline = [
  [-1.5, 3.5, 0],   // Northwest (Tabarka)
  [-0.5, 4.2, 0],   // North (Bizerte)
  [0.5, 4.0, 0],    // Tunis area
  [1.2, 3.8, 0],    // Cap Bon
  [1.0, 2.5, 0],    // Sousse
  [1.5, 1.0, 0],    // Sfax
  [2.0, -1.0, 0],   // Gabes / Zarzis
  [1.5, -3.5, 0],   // Deep South East
  [0.0, -4.5, 0],   // South tip (Borj El Khadra)
  [-1.0, -3.0, 0],  // South West border
  [-2.0, 0.0, 0],   // Mid West border
  [-2.5, 2.0, 0],   // North West border
  [-1.5, 3.5, 0],   // Back to start
].map((p) => new THREE.Vector3(p[0], p[1], p[2]));

// Cities (x, y, z)
const cities = [
  { name: "Tunis", pos: [0.3, 3.8, 0] },
  { name: "Sousse", pos: [0.8, 2.6, 0] },
  { name: "Sfax", pos: [1.3, 1.2, 0] },
  { name: "Gabès", pos: [1.6, -0.8, 0] }
];

// Route for the van
const routePoints = [
  new THREE.Vector3(0.3, 3.8, 0),    // Tunis
  new THREE.Vector3(0.6, 3.2, 0),
  new THREE.Vector3(0.8, 2.6, 0),    // Sousse
  new THREE.Vector3(1.1, 1.9, 0),
  new THREE.Vector3(1.3, 1.2, 0),    // Sfax
  new THREE.Vector3(1.4, 0.2, 0),
  new THREE.Vector3(1.6, -0.8, 0),   // Gabes
];
const routeCurve = new THREE.CatmullRomCurve3(routePoints);

// --- Components ---

function TunisiaMap() {
  return (
    <group>
      {/* Map Outline */}
      <Line
        points={mapOutline}
        color="#ffffff"
        lineWidth={2}
        transparent
        opacity={0.3}
      />
      
      {/* City Nodes */}
      {cities.map((city, i) => (
        <group key={i} position={new THREE.Vector3(...city.pos)}>
          <Sphere args={[0.08, 16, 16]}>
            <meshStandardMaterial color="#2BBFDF" emissive="#2BBFDF" emissiveIntensity={2} toneMapped={false} />
          </Sphere>
          {/* Subtle pulse ring around the city could go here */}
        </group>
      ))}

      {/* Route Line (dashed or solid) */}
      <Line
        points={routeCurve.getPoints(50)}
        color="#2BBFDF"
        lineWidth={1}
        transparent
        opacity={0.5}
        dashed
        dashScale={5}
        dashSize={0.2}
        dashOffset={0}
      />
    </group>
  );
}

function AnimatedVan() {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    
    // Animation loop: 0 to 1 over 10 seconds
    const t = (clock.getElapsedTime() % 10) / 10;
    
    // Get position and tangent for rotation
    const pos = routeCurve.getPointAt(t);
    const tangent = routeCurve.getTangentAt(t).normalize();
    
    groupRef.current.position.copy(pos);
    
    // The curve is in 2D (XY plane). We want the van to orient along it.
    // Up is Z (since we draw map on XY).
    const up = new THREE.Vector3(0, 0, 1);
    
    // Create a rotation matrix looking along the tangent.
    // To make the front of the van face the tangent:
    const lookAtPos = pos.clone().add(tangent);
    groupRef.current.up.copy(up);
    groupRef.current.lookAt(lookAtPos);
    
    // Add a slight hover effect
    groupRef.current.position.z = Math.sin(clock.getElapsedTime() * 5) * 0.05 + 0.1;
  });

  return (
    <group ref={groupRef}>
      <Trail
        width={0.2}
        length={4}
        color="#F5C800"
        attenuation={(t) => t * t}
      >
        <group>
          {/* Van Body (White/Ice Blue) */}
          <Box args={[0.3, 0.4, 0.5]} position={[0, 0, 0.25]}>
            <meshStandardMaterial color="#ffffff" roughness={0.5} />
          </Box>
          <Box args={[0.3, 0.5, 0.4]} position={[0, -0.15, 0.2]}>
            <meshStandardMaterial color="#F0F6FA" roughness={0.5} />
          </Box>
          
          {/* Z Lightning Bolt on side (Yellow) */}
          <Box args={[0.32, 0.2, 0.1]} position={[0, 0, 0.3]}>
            <meshStandardMaterial color="#F5C800" emissive="#F5C800" emissiveIntensity={1} />
          </Box>
        </group>
      </Trail>
    </group>
  );
}

export default function HeroScene() {
  return (
    <div className="absolute inset-0 w-full h-full z-0 pointer-events-none hidden md:block">
      <Canvas camera={{ position: [2, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <pointLight position={[0, 0, 5]} intensity={0.5} color="#2BBFDF" />
        
        <group position={[-1, 0, 0]}>
          <TunisiaMap />
          <AnimatedVan />
        </group>

        {/* Slow rotation for depth feel */}
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          enableRotate={true}
          autoRotate
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
    </div>
  );
}
