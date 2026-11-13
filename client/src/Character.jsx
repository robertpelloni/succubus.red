import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import * as THREE from 'three';
import { loadMixamoAnimation } from './MixamoVRMRetargeting';

export default function Character({
  url = '/avatar.vrm',
  currentAnimation = 'idle',
  customAnimationAsset = null,
  emotion = null,
  isSpeaking = false,
  visemes = null,
  springBoneStiffness = 1.0,
  springBoneDragForce = 0.4,
  crossfadeDuration = 0.25,
  landingPhysicsEnabled = true,
  onFpsUpdate = null,
  onAvatarPointerDown = null
}) {
  const group = useRef();
  const [vrm, setVrm] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const mountScaleRef = useRef(0.0);
  const landingOffsetYRef = useRef(landingPhysicsEnabled ? 0.35 : 0.0);
  const activeVrmRef = useRef(null);
  const activeMixerRef = useRef(null);
  const [mixer, setMixer] = useState(null);
  const [actions, setActions] = useState({});

  useEffect(() => {
    let isCancelled = false;
    mountScaleRef.current = 0.0;
    landingOffsetYRef.current = landingPhysicsEnabled ? 0.35 : 0.0;
    if (group.current) {
      group.current.scale.set(0, 0, 0);
      group.current.position.y = landingOffsetYRef.current;
    }

    loader.load(
      '/avatar.vrm',
      (gltf) => {
        const loadedVrm = gltf.userData.vrm;
        VRMUtils.removeUnnecessaryJoints(gltf.scene);

        // Turn character to face camera
        loadedVrm.scene.rotation.y = 0;

        setVrm(loadedVrm);

        const newMixer = new THREE.AnimationMixer(loadedVrm.scene);
        setMixer(newMixer);

            // Compute bounding box to align feet flush with stage floor
            const bbox = new THREE.Box3().setFromObject(loadedVrm.scene);
            const modelHeight = bbox.max.y - bbox.min.y;

            // Normalize outlier scales if model is abnormally small or oversized
            if (modelHeight > 0.1 && (modelHeight < 0.8 || modelHeight > 2.5)) {
              const desiredHeight = 1.6;
              const scaleFactor = desiredHeight / modelHeight;
              loadedVrm.scene.scale.set(scaleFactor, scaleFactor, scaleFactor);
              bbox.setFromObject(loadedVrm.scene);
            }

            // Align ground contact point to y = 0
            if (bbox.min.y !== 0) {
              loadedVrm.scene.position.y -= bbox.min.y;
            }

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
            }
          } catch (error) {
            console.error('Error loading animation:', error);
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
  }, [url, landingPhysicsEnabled]);

  const currentActionRef = useRef(null);
  const previousAnimationRef = useRef(null);
  const fpsFrameCountRef = useRef(0);
  const fpsLastTimeRef = useRef(0);

  // Dynamically load, retarget, and register custom dropped FBX animation
  useEffect(() => {
    if (!vrm || !mixer || !customAnimationAsset) return;

    let isDisposed = false;
    const loadCustomFbx = async () => {
      try {
        const { url: fbxUrl, name } = customAnimationAsset;
        const fbxLoader = new FBXLoader();
        const animGltf = await fbxLoader.loadAsync(fbxUrl);
        if (isDisposed) return;

        const clip = loadMixamoAnimation(animGltf, vrm);
        if (clip) {
          const action = mixer.clipAction(clip);
          setActions((prev) => ({ ...prev, [name]: action }));

          // Automatically switch and crossfade into the new dropped animation
          if (currentActionRef.current) {
            currentActionRef.current.fadeOut(crossfadeDuration);
          }
          action.reset().fadeIn(crossfadeDuration).play();
          currentActionRef.current = action;
          previousAnimationRef.current = name;
        }
      } catch (err) {
        console.error("Failed to retarget custom FBX animation:", err);
      }
    };

    loadCustomFbx();
    return () => {
      isDisposed = true;
    };
  }, [customAnimationAsset, vrm, mixer, crossfadeDuration]);

  useEffect(() => {
    if (vrm && actions[currentAnimation]) {
      // Prevent resetting the animation if we are already playing it
      if (previousAnimationRef.current === currentAnimation && currentActionRef.current) {
        return;
      }

      const nextAction = actions[currentAnimation];

      if (currentActionRef.current && currentActionRef.current !== nextAction) {
        currentActionRef.current.fadeOut(crossfadeDuration);
      }

      nextAction.reset().fadeIn(crossfadeDuration).play();
      currentActionRef.current = nextAction;
      previousAnimationRef.current = currentAnimation;
    }
  }, [currentAnimation, actions, vrm, crossfadeDuration]);

  useFrame((state, delta) => {
    // Rolling FPS calculation
    fpsFrameCountRef.current += 1;
    const now = state.clock.elapsedTime;
    if (now - fpsLastTimeRef.current >= 0.5) {
      const currentFps = Math.round((fpsFrameCountRef.current / (now - fpsLastTimeRef.current)));
      if (onFpsUpdate) onFpsUpdate(currentFps);
      fpsFrameCountRef.current = 0;
      fpsLastTimeRef.current = now;
    }

    if (mixer) mixer.update(delta);
    if (vrm && group.current) {
      // Smooth materialization scale-in directly on Three.js transform without re-rendering React
      if (mountScaleRef.current < 1.0) {
        mountScaleRef.current = Math.min(1.0, mountScaleRef.current + delta * 2.5);
        const s = mountScaleRef.current;
        group.current.scale.set(s, s, s);
      }

      // Smooth landing physics settling toward y = 0 directly on transform
      if (landingOffsetYRef.current > 0.001) {
        landingOffsetYRef.current = Math.max(0.0, landingOffsetYRef.current - landingOffsetYRef.current * delta * 6.0);
        group.current.position.y = landingOffsetYRef.current;
      }

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
          const t = state.clock.elapsedTime * 15;
          const mouthOpen = (Math.sin(t) + 1) / 2;
          vrm.expressionManager.setValue('aa', mouthOpen * 0.8);
        } else {
          vrm.expressionManager.setValue('aa', 0);
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
          } catch (e) {
            // Ignore if expression doesn't exist
          }
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
      position={[0, landingPhysicsEnabled ? 0.35 : 0.0, 0]}
      rotation={[0, Math.PI, 0]}
      scale={[0, 0, 0]}
      onPointerDown={handlePointerDown}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {vrm && <primitive object={vrm.scene} dispose={null} />}
    </group>
  );
}
