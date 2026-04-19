import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs-core';
import type { LandmarkName, PoseLandmarks } from '../types/pose';

const keypointNameMap: Record<string, LandmarkName> = {
  nose: 'nose',
  left_eye: 'left_eye',
  right_eye: 'right_eye',
  left_ear: 'left_ear',
  right_ear: 'right_ear',
  left_shoulder: 'left_shoulder',
  right_shoulder: 'right_shoulder',
  left_elbow: 'left_elbow',
  right_elbow: 'right_elbow',
  left_wrist: 'left_wrist',
  right_wrist: 'right_wrist',
  left_hip: 'left_hip',
  right_hip: 'right_hip',
  left_knee: 'left_knee',
  right_knee: 'right_knee',
  left_ankle: 'left_ankle',
  right_ankle: 'right_ankle'
};

export async function createPoseDetector(): Promise<poseDetection.PoseDetector> {
  await tf.setBackend('webgl');
  await tf.ready();

  return poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
    modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
    enableSmoothing: false
  });
}

export function normalizePose(pose?: poseDetection.Pose): PoseLandmarks {
  if (!pose?.keypoints) return {};

  return pose.keypoints.reduce<PoseLandmarks>((acc, keypoint) => {
    const name = keypoint.name ? keypointNameMap[keypoint.name] : undefined;
    if (!name) return acc;
    acc[name] = {
      name,
      x: keypoint.x,
      y: keypoint.y,
      score: keypoint.score ?? 0
    };
    return acc;
  }, {});
}

export const skeletonPairs: Array<[LandmarkName, LandmarkName]> = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle']
];
