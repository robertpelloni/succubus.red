import React, { useState, useEffect } from 'react';
import { Environment as DreiEnvironment, ContactShadows, Sky } from '@react-three/drei';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { fetchAndCache } from './CacheUtils';

export default function Environment({ lightsOn = true, file = 'room.glb', soundEffectsEnabled = true }) {
  const [modelUrl, setModelUrl] = useState(null);

  useEffect(() => {
    if (!file || file === 'none') {
        setModelUrl(null);
        return;
    }

    if (file.startsWith('blob:') || file.startsWith('data:')) {
      setModelUrl(file);
      return;
    }

    const loadEnvironment = async () => {
      try {
        const cachedUrl = await fetchAndCache(`/${file}`);
        setModelUrl(cachedUrl);
      } catch (err) {
        console.error("Failed to load environment from cache:", err);
      }
    };
    loadEnvironment();
  }, [file]);

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

  const playSpatialHoverSound = (pointX) => {
    if (!soundEffectsEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      if (ctx.createStereoPanner) {
        const panner = ctx.createStereoPanner();
        // Normalize 3D X coordinate (-3 to +3) to pan (-1 to +1)
        const panValue = Math.max(-1, Math.min(1, (pointX || 0) / 3));
        panner.pan.setValueAtTime(panValue, ctx.currentTime);
        osc.connect(panner);
        panner.connect(gain);
      } else {
        osc.connect(gain);
      }

      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  };

  const handlePointerOver = (e) => {
    e.stopPropagation();
    if (e.object.isMesh && e.object.material) {
      setHoveredMesh(e.object.uuid);
      playSpatialHoverSound(e.point?.x);
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
      {lightsOn && <Sky distance={450000} sunPosition={[5, 1, 8]} inclination={0} azimuth={0.25} />}
      <DreiEnvironment preset={lightsOn ? "city" : "night"} background={false} />

      {gltfScene && (
        <primitive
          object={gltfScene}
          position={[0, -1.0, -1.5]}
          scale={[1.2, 1.2, 1.2]}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />
      )}

      {/* Realistic contact shadow beneath the character */}
      <ContactShadows position={[0, 0.05, 0]} opacity={0.8} scale={3} blur={2.5} far={4} resolution={256} color="#000000" />
    </group>
  );
}
