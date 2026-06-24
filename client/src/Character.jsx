import React, { useEffect, useState, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import * as THREE from 'three';
import { LipSyncAnalyser } from './LipSyncAnalyser';
import { loadMixamoAnimation } from './MixamoVRMRetargeting';

export default function Character({ url, currentAnimation = 'idle', emotion = null, isSpeaking = false }) {
  const [vrm, setVrm] = useState(null);
  const lipSyncRef = useRef(null);
  const mixerRef = useRef(null);
  const actionsRef = useRef({});
  const activeActionRef = useRef(null);
  const { camera } = useThree();

  const idleFbx = useLoader(FBXLoader, '/Idle.fbx');
  const waveFbx = useLoader(FBXLoader, '/Wave.fbx');

  const gltf = useLoader(GLTFLoader, url, (loader) => {
    loader.register((parser) => {
      return new VRMLoaderPlugin(parser);
    });
  });

  useEffect(() => {
    if (gltf.userData.vrm) {
      const loadedVrm = gltf.userData.vrm;

      VRMUtils.removeUnnecessaryVertices(loadedVrm.scene);
      VRMUtils.removeUnnecessaryJoints(loadedVrm.scene);

      // Face the camera correctly. Default is facing away from +Z
      loadedVrm.scene.rotation.y = Math.PI;

      setVrm(loadedVrm);

      // Animation Setup
      const mixer = new THREE.AnimationMixer(loadedVrm.scene);
      mixerRef.current = mixer;

      const prepareAnimation = (fbx, name) => {
        const clip = loadMixamoAnimation(fbx, loadedVrm);
        if (!clip) return;

        const action = mixer.clipAction(clip);
        action.name = name;
        actionsRef.current[name] = action;
      };

      prepareAnimation(idleFbx, 'idle');
      prepareAnimation(waveFbx, 'wave');

      if (actionsRef.current['idle']) {
        actionsRef.current['idle'].play();
        activeActionRef.current = actionsRef.current['idle'];
      }
    }
  }, [gltf, idleFbx, waveFbx]);

  useEffect(() => {
    if (mixerRef.current && actionsRef.current[currentAnimation]) {
      const newAction = actionsRef.current[currentAnimation];
      const oldAction = activeActionRef.current;

      if (oldAction !== newAction) {
        if (oldAction) {
          oldAction.fadeOut(0.35);
        }
        newAction.reset().fadeIn(0.35).play();
        activeActionRef.current = newAction;
      }
    }
  }, [currentAnimation]);

  useEffect(() => {
    if (vrm && emotion) {
      vrm.expressionManager.setValue(emotion.name, emotion.value);
    }
  }, [emotion, vrm]);

  useFrame((state, delta) => {
    if (vrm) {
      // Look at tracking (follow camera)
      if (vrm.lookAt) {
        vrm.lookAt.target = camera;
      }

      if (lipSyncRef.current) {
        const visemes = lipSyncRef.current.update();
        vrm.expressionManager.setValue('aa', visemes.a);
        vrm.expressionManager.setValue('ih', visemes.i);
        vrm.expressionManager.setValue('ou', visemes.u);
      } else if (isSpeaking) {
        // Pseudo lipsync fallback when no audio context is hooked
        const time = Date.now() * 0.01;
        vrm.expressionManager.setValue('aa', Math.sin(time) * 0.5 + 0.5);
        vrm.expressionManager.setValue('ih', Math.cos(time * 1.5) * 0.5 + 0.5);
        vrm.expressionManager.setValue('ou', Math.sin(time * 0.8) * 0.5 + 0.5);
      } else {
        vrm.expressionManager.setValue('aa', 0);
        vrm.expressionManager.setValue('ih', 0);
        vrm.expressionManager.setValue('ou', 0);
      }

      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }

      vrm.update(delta);
    }
  });

  if (!vrm) {
    return null;
  }

  return <primitive object={vrm.scene} dispose={null} />;
}
