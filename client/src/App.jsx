import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Character from './Character';
import './App.css';

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#222' }}>
      <Canvas camera={{ position: [0, 1.5, 3], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1} />

        <Suspense fallback={null}>
          <Character url="/avatar.vrm" />
        </Suspense>

        <OrbitControls target={[0, 1.2, 0]} />
      </Canvas>
    </div>
  );
}

export default App;
