import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import * as THREE from 'three';
import { loadMixamoAnimation } from './MixamoVRMRetargeting';

export default function Character({ currentAnimation = 'idle', emotion = null, isSpeaking = false }) {
  const group = useRef();
  const [vrm, setVrm] = useState(null);
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

            const clip = loadMixamoAnimation(animGltf, loadedVrm);
            if (clip) {
              const action = newMixer.clipAction(clip);
              setActions((prev) => ({ ...prev, [name]: action }));

              if (name === currentAnimation) {
                action.reset().fadeIn(0.2).play();
              }
            }
          } catch (error) {
            console.error('Error loading animation:', error);
          }
        };

        loadAnim('/Idle.fbx', 'idle');
        loadAnim('/Wave.fbx', 'wave');
      },
      (progress) => console.log('Loading model...', 100.0 * (progress.loaded / progress.total), '%'),
      (error) => console.error('Failed to load VRM:', error)
    );
  }, []);

  useEffect(() => {
    if (vrm && actions[currentAnimation]) {
      Object.values(actions).forEach((action) => action.fadeOut(0.2));
      actions[currentAnimation].reset().fadeIn(0.2).play();
    }
  }, [currentAnimation, actions, vrm]);

  useFrame((state, delta) => {
    if (mixer) mixer.update(delta);
    if (vrm) {
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

  return (
    <group ref={group}>
      {vrm && <primitive object={vrm.scene} dispose={null} />}
    </group>
  );
}
