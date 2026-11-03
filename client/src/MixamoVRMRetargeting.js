import * as THREE from 'three';

// Mixamo to VRM humanoid bone map
export const mixamoVRMRigMap = {
	mixamorigHips: 'hips',
	mixamorigSpine: 'spine',
	mixamorigSpine1: 'chest',
	mixamorigSpine2: 'upperChest',
	mixamorigNeck: 'neck',
	mixamorigHead: 'head',
	mixamorigLeftShoulder: 'leftShoulder',
	mixamorigLeftArm: 'leftUpperArm',
	mixamorigLeftForeArm: 'leftLowerArm',
	mixamorigLeftHand: 'leftHand',
	mixamorigRightShoulder: 'rightShoulder',
	mixamorigRightArm: 'rightUpperArm',
	mixamorigRightForeArm: 'rightLowerArm',
	mixamorigRightHand: 'rightHand',
	mixamorigLeftUpLeg: 'leftUpperLeg',
	mixamorigLeftLeg: 'leftLowerLeg',
	mixamorigLeftFoot: 'leftFoot',
	mixamorigLeftToeBase: 'leftToes',
	mixamorigRightUpLeg: 'rightUpperLeg',
	mixamorigRightLeg: 'rightLowerLeg',
	mixamorigRightFoot: 'rightFoot',
	mixamorigRightToeBase: 'rightToes'
};

export function loadMixamoAnimation(asset, vrm) {
	const clip = THREE.AnimationClip.findByName(asset.animations, 'mixamo.com') || asset.animations[0];
	if (!clip) return null;

	const tracks = [];
	const restRotationInverse = new THREE.Quaternion();
	const parentRestWorldRotation = new THREE.Quaternion();
	const _quatA = new THREE.Quaternion();
	const _vec3 = new THREE.Vector3();

	const motionHipsHeight = asset.getObjectByName('mixamorigHips')?.position.y ?? 1;
	const vrmHipsY = vrm.humanoid?.getNormalizedBoneNode('hips')?.getWorldPosition(_vec3).y ?? 0;
	const vrmRootY = vrm.scene.getWorldPosition(_vec3).y;
	const vrmHipsHeight = Math.abs(vrmHipsY - vrmRootY);
	const hipsPositionScale = vrmHipsHeight / motionHipsHeight;

	clip.tracks.forEach((track) => {
		const trackSplitted = track.name.split('.');
		const mixamoRigName = trackSplitted[0];
		const vrmBoneName = mixamoVRMRigMap[mixamoRigName];
		if (!vrmBoneName) return;
		const vrmNodeName = vrm.humanoid?.getNormalizedBoneNode(vrmBoneName)?.name;
		const mixamoRigNode = asset.getObjectByName(mixamoRigName);

		if (vrmNodeName != null && mixamoRigNode) {
			const propertyName = trackSplitted[1];

			mixamoRigNode.getWorldQuaternion(restRotationInverse).invert();
			mixamoRigNode.parent.getWorldQuaternion(parentRestWorldRotation);

			if (track instanceof THREE.QuaternionKeyframeTrack) {
				for (let i = 0; i < track.values.length; i += 4) {
					_quatA.set(track.values[i], track.values[i + 1], track.values[i + 2], track.values[i + 3]);
					_quatA.premultiply(parentRestWorldRotation).multiply(restRotationInverse);
					track.values[i] = _quatA.x;
					track.values[i + 1] = _quatA.y;
					track.values[i + 2] = _quatA.z;
					track.values[i + 3] = _quatA.w;
				}

				tracks.push(
					new THREE.QuaternionKeyframeTrack(
						`${vrmNodeName}.${propertyName}`,
						track.times,
						track.values.map((v, i) =>
							vrm.meta?.metaVersion === '0' && i % 2 === 0 ? -v : v
						)
					)
				);
			} else if (track instanceof THREE.VectorKeyframeTrack) {
				if (vrmBoneName !== 'hips') return;

				const vrmNode = vrm.humanoid?.getNormalizedBoneNode(vrmBoneName);
				const vrmRestX = vrmNode ? vrmNode.position.x : 0;
				const vrmRestY = vrmNode ? vrmNode.position.y : 0;
				const vrmRestZ = vrmNode ? vrmNode.position.z : 0;
				const mixRestX = mixamoRigNode.position.x;
				const mixRestY = mixamoRigNode.position.y;
				const mixRestZ = mixamoRigNode.position.z;

				const value = new Float32Array(track.values.length);
				for (let i = 0; i < track.values.length; i += 3) {
					let dx = track.values[i] - mixRestX;
					let dy = track.values[i + 1] - mixRestY;
					let dz = track.values[i + 2] - mixRestZ;
					if (vrm.meta?.metaVersion === '0') { dx = -dx; dz = -dz; }
					value[i] = vrmRestX + dx * hipsPositionScale;
					value[i + 1] = vrmRestY + dy * hipsPositionScale;
					value[i + 2] = vrmRestZ + dz * hipsPositionScale;
				}

				tracks.push(
					new THREE.VectorKeyframeTrack(
						`${vrmNodeName}.${propertyName}`,
						track.times,
						value
					)
				);
			}
		}
	});

	return tracks.length > 0 ? new THREE.AnimationClip('vrmAnimation', clip.duration, tracks) : null;
}
