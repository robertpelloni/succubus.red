import React, { useEffect, useState, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';
import * as THREE from 'three';
import { LipSyncAnalyser } from './LipSyncAnalyser';

export default function Character({ url }) {
  const [vrm, setVrm] = useState(null);
  const lipSyncRef = useRef(null);
  const { camera } = useThree();

  const gltf = useLoader(GLTFLoader, url, (loader) => {
    loader.register((parser) => {
      return new VRMLoaderPlugin(parser);
    });
  });

  useEffect(() => {
    if (gltf.userData.vrm) {
      const loadedVrm = gltf.userData.vrm;
      setVrm(loadedVrm);

      // Face the camera correctly. Default is facing away from +Z
      loadedVrm.scene.rotation.y = Math.PI * 2;
    }
  }, [gltf]);

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
      }

      vrm.update(delta);
    }
  });

  if (!vrm) {
    return null;
  }

  return <primitive object={vrm.scene} dispose={null} />;
}
