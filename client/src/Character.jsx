import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import * as THREE from 'three';
import { loadMixamoAnimation } from './MixamoVRMRetargeting';
import { fetchAndCache } from './CacheUtils';

export default function Character({ currentAnimation = 'idle', emotion = null, isSpeaking = false, visemes = null }) {
  const group = useRef();
  const [vrm, setVrm] = useState(null);
  const [mixer, setMixer] = useState(null);
  const [actions, setActions] = useState({});
  const lookAtTargetRef = useRef(new THREE.Object3D());

  // Keep track of the initial animation to prevent re-running the loader
  const initialAnimationRef = useRef(currentAnimation);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        const vrmUrl = await fetchAndCache('/avatar.vrm');

        const loader = new GLTFLoader();
        loader.register((parser) => new VRMLoaderPlugin(parser));

        loader.load(
          vrmUrl,
          (gltf) => {
            const loadedVrm = gltf.userData.vrm;
            VRMUtils.removeUnnecessaryJoints(gltf.scene);

            // Turn character to face camera
            loadedVrm.scene.rotation.y = Math.PI;

            // Set lookAt target for mouse tracking
            if (loadedVrm.lookAt) {
              loadedVrm.lookAt.target = lookAtTargetRef.current;
            }

            setVrm(loadedVrm);

            const newMixer = new THREE.AnimationMixer(loadedVrm.scene);
            setMixer(newMixer);

            const loadAnim = async (url, name) => {
              try {
                const cachedUrl = await fetchAndCache(url);
                const fbxLoader = new FBXLoader();
                const animGltf = await fbxLoader.loadAsync(cachedUrl);

                const clip = loadMixamoAnimation(animGltf, loadedVrm);
                if (clip) {
                  const action = newMixer.clipAction(clip);
                  setActions((prev) => ({ ...prev, [name]: action }));

                  if (name === initialAnimationRef.current) {
                    action.reset().fadeIn(0.2).play();
                  }
                }
              } catch (error) {
                console.error(`Error loading animation ${name}:`, error);
              }
            };

            loadAnim('/Idle.fbx', 'idle');
            loadAnim('/Wave.fbx', 'wave');
            loadAnim('/Sitting.fbx', 'sitting');
            loadAnim('/Thinking.fbx', 'thinking');
          },
          (progress) => console.log('Loading model...', 100.0 * (progress.loaded / progress.total), '%'),
          (error) => console.error('Failed to parse VRM:', error)
        );
      } catch (err) {
        console.error('Failed to load assets via cache:', err);
      }
    };

    loadAssets();
  }, []);

  const currentActionRef = useRef(null);
  const previousAnimationRef = useRef(null);

  useEffect(() => {
    if (vrm && actions[currentAnimation]) {
      // Prevent resetting the animation if we are already playing it
      if (previousAnimationRef.current === currentAnimation && currentActionRef.current) {
        return;
      }

      const nextAction = actions[currentAnimation];

      if (currentActionRef.current && currentActionRef.current !== nextAction) {
        currentActionRef.current.fadeOut(0.2);
      }

      nextAction.reset().fadeIn(0.2).play();
      currentActionRef.current = nextAction;
      previousAnimationRef.current = currentAnimation;
    }
  }, [currentAnimation, actions, vrm]);

  useFrame((state, delta) => {
    if (mixer) mixer.update(delta);
    if (vrm) {
      // Map mouse coordinates to 3D space for the lookAt target
      // Camera is usually at z=3, character at z=0.
      // We scale the mouse coordinates to make the head move naturally.
      lookAtTargetRef.current.position.x = state.mouse.x * 2;
      lookAtTargetRef.current.position.y = state.mouse.y * 2 + 1.2; // 1.2 is approx head height
      lookAtTargetRef.current.position.z = 2; // Position the target in front of the character

      vrm.update(delta);

      if (vrm.expressionManager) {
        if (isSpeaking) {
          if (visemes && (visemes.a > 0 || visemes.i > 0 || visemes.u > 0)) {
            // Use FFT visemes if available
            vrm.expressionManager.setValue('aa', visemes.a);
            vrm.expressionManager.setValue('ih', visemes.i);
            vrm.expressionManager.setValue('ou', visemes.u);
          } else {
            // Fallback to mathematical pseudo-lipsync
            const t = state.clock.elapsedTime * 15;
            const mouthOpen = (Math.sin(t) + 1) / 2;
            vrm.expressionManager.setValue('aa', mouthOpen * 0.8);
            vrm.expressionManager.setValue('ih', 0);
            vrm.expressionManager.setValue('ou', 0);
          }
        } else {
          vrm.expressionManager.setValue('aa', 0);
          vrm.expressionManager.setValue('ih', 0);
          vrm.expressionManager.setValue('ou', 0);
        }

        // Handle emotions
        const emotions = ['happy', 'angry', 'sad', 'relaxed', 'surprised'];
        emotions.forEach(emo => {
          vrm.expressionManager.setValue(emo, 0);
        });

        if (emotion && emotion.name) {
          const validEmotionMap = {
            'joy': 'happy',
            'happy': 'happy',
            'angry': 'angry',
            'sorrow': 'sad',
            'sad': 'sad',
            'fun': 'relaxed',
            'relaxed': 'relaxed',
            'surprised': 'surprised',
            'excited': 'happy'
          };

          const targetEmo = validEmotionMap[emotion.name.toLowerCase()] || emotion.name.toLowerCase();

          try {
            vrm.expressionManager.setValue(targetEmo, emotion.value || 1);
          } catch {
            console.warn(`Blendshape missing for emotion: ${targetEmo}`);
          }
        }
      }
    }
  });

  return (
    <group ref={group} rotation={[0, Math.PI, 0]}>
      {vrm && <primitive object={vrm.scene} dispose={null} />}
    </group>
  );
}
