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
  emotion = null,
  isSpeaking = false,
  visemes = null,
  springBoneStiffness = 1.0,
  springBoneDragForce = 0.4,
  onAvatarPointerDown = null
}) {
  const group = useRef();
  const [vrm, setVrm] = useState(null);
  const activeVrmRef = useRef(null);
  const activeMixerRef = useRef(null);
  const [mixer, setMixer] = useState(null);
  const [actions, setActions] = useState({});

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

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

        const loadAnim = async (url, name) => {
          try {
            const fbxLoader = new FBXLoader();
            const animGltf = await fbxLoader.loadAsync(url);

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
  }, [url]);

  const currentActionRef = useRef(null);
  const previousAnimationRef = useRef(null);

  useEffect(() => {
    if (vrm && actions[currentAnimation]) {
      Object.values(actions).forEach((action) => action.fadeOut(0.2));
      actions[currentAnimation].reset().fadeIn(0.2).play();
    }
  }, [currentAnimation, actions, vrm]);

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

  const [isHovered, setIsHovered] = useState(false);

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
