import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import * as THREE from 'three';
import { loadMixamoAnimation } from './MixamoVRMRetargeting';
import { fetchAndCache } from './CacheUtils';

export default function Character({
  url = '/avatar.vrm',
  currentAnimation = 'idle',
  emotion = null,
  isSpeaking = false,
  visemes = null,
  springBoneStiffness = 1.0,
  springBoneDragForce = 0.4,
  onAvatarPointerDown = null
}) {
  const group = useRef();
  const [vrm, setVrm] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const activeVrmRef = useRef(null);
  const activeMixerRef = useRef(null);
  const [mixer, setMixer] = useState(null);
  const [actions, setActions] = useState({});
  const lookAtTargetRef = useRef(new THREE.Object3D());

  // Current smoothed emotion blendshape weights
  const emotionWeightsRef = useRef({
    happy: 0,
    angry: 0,
    sad: 0,
    relaxed: 0,
    surprised: 0
  });

  // Procedural natural eye blinking state
  const blinkStateRef = useRef({
    nextBlinkTime: 3.0,
    blinkDuration: 0.18,
    timer: 0.0,
    isBlinking: false
  });

  // Keep track of the initial animation
  const initialAnimationRef = useRef(currentAnimation);

  useEffect(() => {
    let isCancelled = false;

    const loadAssets = async () => {
      try {
        // If it's a blob: or data: URL, use it directly; otherwise fetchAndCache
        const vrmUrl = url.startsWith('blob:') || url.startsWith('data:') ? url : await fetchAndCache(url);

        const loader = new GLTFLoader();
        loader.register((parser) => new VRMLoaderPlugin(parser));

        loader.load(
          vrmUrl,
          (gltf) => {
            if (isCancelled) return;
            const loadedVrm = gltf.userData.vrm;
            VRMUtils.removeUnnecessaryJoints(gltf.scene);

            // Turn character to face camera
            loadedVrm.scene.rotation.y = Math.PI;

            // Set lookAt target for mouse tracking
            if (loadedVrm.lookAt) {
              loadedVrm.lookAt.target = lookAtTargetRef.current;
            }

            setVrm(loadedVrm);
            activeVrmRef.current = loadedVrm;

            const newMixer = new THREE.AnimationMixer(loadedVrm.scene);
            setMixer(newMixer);
            activeMixerRef.current = newMixer;

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

    return () => {
      isCancelled = true;
      if (activeMixerRef.current) {
        activeMixerRef.current.stopAllAction();
      }
      if (activeVrmRef.current && activeVrmRef.current.scene) {
        try {
          VRMUtils.deepDispose(activeVrmRef.current.scene);
        } catch (e) {
          console.warn("Error during VRM scene deepDispose:", e);
        }
      }
    };
  }, [url]);

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

  // Update spring bone physics dynamically when sliders change
  useEffect(() => {
    if (vrm && vrm.springBoneManager) {
      const joints = vrm.springBoneManager.joints;
      if (joints) {
        joints.forEach(joint => {
          if (joint.settings) {
            joint.settings.stiffness = springBoneStiffness;
            joint.settings.dragForce = springBoneDragForce;
          }
        });
      }
    }
  }, [vrm, springBoneStiffness, springBoneDragForce]);

  useFrame((state, delta) => {
    if (mixer) mixer.update(delta);
    if (vrm) {
      // Map mouse coordinates to 3D space for the lookAt target
      // Camera is usually at z=3, character at z=0.
      // We scale the mouse coordinates to make the head move naturally.
      // Subtly amplify tracking responsiveness when hovered
      const trackingFactor = isHovered ? 2.4 : 2.0;
      lookAtTargetRef.current.position.x = state.mouse.x * trackingFactor;
      lookAtTargetRef.current.position.y = state.mouse.y * trackingFactor + 1.2; // 1.2 is approx head height
      lookAtTargetRef.current.position.z = isHovered ? 1.6 : 2.0; // Brings gaze slightly closer when hovered

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

        // Handle emotions with smooth exponential easing
        const emotions = ['happy', 'angry', 'sad', 'relaxed', 'surprised'];
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

        const activeTarget = emotion && emotion.name
          ? (validEmotionMap[emotion.name.toLowerCase()] || emotion.name.toLowerCase())
          : null;
        const targetValue = emotion && emotion.value ? emotion.value : 1.0;

        emotions.forEach(emo => {
          const targetWeight = (emo === activeTarget) ? targetValue : 0;
          const currentWeight = emotionWeightsRef.current[emo] || 0;
          const smoothed = THREE.MathUtils.lerp(currentWeight, targetWeight, Math.min(1.0, delta * 8.0));
          emotionWeightsRef.current[emo] = smoothed;

          try {
            vrm.expressionManager.setValue(emo, smoothed);
          } catch {
            console.warn(`Blendshape missing for emotion: ${emo}`);
          }
        });

        // Procedural natural eye blinking
        const b = blinkStateRef.current;
        b.timer += delta;

        let blinkWeight = 0;
        if (!b.isBlinking) {
          if (b.timer >= b.nextBlinkTime) {
            b.isBlinking = true;
            b.timer = 0;
          }
        } else {
          // In the middle of a blink
          if (b.timer < b.blinkDuration) {
            // Half-sine curve for smooth close and open: sin(pi * progress)
            const progress = b.timer / b.blinkDuration;
            blinkWeight = Math.sin(Math.PI * progress);
          } else {
            // Blink finished, schedule next blink (between 2.5 and 5.5 seconds)
            b.isBlinking = false;
            b.timer = 0;
            b.nextBlinkTime = 2.5 + Math.random() * 3.0;
          }
        }

        try {
          vrm.expressionManager.setValue('blink', blinkWeight);
        } catch {
          // Model might not expose standard blink preset
        }
      }
    }
  });

  const handlePointerDown = (e) => {
    e.stopPropagation();
    if (onAvatarPointerDown) {
      onAvatarPointerDown(e);
    }
  };

  const handlePointerOver = (e) => {
    e.stopPropagation();
    setIsHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e) => {
    e.stopPropagation();
    setIsHovered(false);
    document.body.style.cursor = 'default';
  };

  return (
    <group
      ref={group}
      rotation={[0, Math.PI, 0]}
      onPointerDown={handlePointerDown}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {vrm && <primitive object={vrm.scene} dispose={null} />}
    </group>
  );
}
