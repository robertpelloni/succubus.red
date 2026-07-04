import React, { useState, useEffect } from 'react';
import { Environment as DreiEnvironment, ContactShadows, Sky } from '@react-three/drei';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { fetchAndCache } from './CacheUtils';

export default function Environment() {
  const [modelUrl, setModelUrl] = useState(null);

  useEffect(() => {
    const loadEnvironment = async () => {
      try {
        const cachedUrl = await fetchAndCache('/room.glb');
        setModelUrl(cachedUrl);
      } catch (err) {
        console.error("Failed to load environment from cache:", err);
      }
    };
    loadEnvironment();
  }, []);

  const [gltfScene, setGltfScene] = useState(null);
  const [, setHoveredMesh] = useState(null);

  useEffect(() => {
    if (modelUrl) {
      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          // Prepare meshes for interaction
          gltf.scene.traverse((child) => {
            if (child.isMesh) {
              child.receiveShadow = true;
              child.castShadow = true;

              // Ensure material can emit light for highlighting
              if (child.material) {
                // Clone material so instances don't share highlight state
                child.material = child.material.clone();
                if (!child.material.emissive) {
                  child.material.emissive = new THREE.Color(0x000000);
                }
              }
            }
          });
          setGltfScene(gltf.scene);
        },
        undefined,
        (error) => console.error("An error happened loading the GLTF:", error)
      );
    }
  }, [modelUrl]);

  const handlePointerOver = (e) => {
    e.stopPropagation();
    if (e.object.isMesh && e.object.material) {
      setHoveredMesh(e.object.uuid);
      e.object.material.emissive.setHex(0x333333); // subtle highlight
    }
  };

  const handlePointerOut = (e) => {
    e.stopPropagation();
    if (e.object.isMesh && e.object.material) {
      setHoveredMesh(null);
      e.object.material.emissive.setHex(0x000000);
    }
  };

  return (
    <group>
      <Sky distance={450000} sunPosition={[5, 1, 8]} inclination={0} azimuth={0.25} />
      <DreiEnvironment preset="city" />

      {gltfScene && (
        <primitive
          object={gltfScene}
          position={[0, -0.5, 0]}
          scale={[2, 2, 2]}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />
      )}

      {/* Realistic contact shadow beneath the character */}
      <ContactShadows position={[0, 0.05, 0]} opacity={0.8} scale={3} blur={2.5} far={4} resolution={256} color="#000000" />
    </group>
  );
}
