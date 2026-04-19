import { exerciseThresholds } from '../../config/exerciseThresholds';
import { feedback } from '../feedbackEngine';
import {
  angleFromLandmarks,
  bilateralAverage,
  getPoint,
  lineAngleDeg,
  midpoint,
  signedTorsoLeanRatio
} from '../../pose/poseUtils';
import type { ExerciseDefinition, ExerciseEvaluation, ExerciseFrame } from '../../types/exercise';

export const pushupExercise: ExerciseDefinition = {
  id: 'pushup',
  label: 'Push-up',
  setupHint: 'Place the camera side-on so shoulders, elbows, hips, and ankles are visible.',
  trackedJoints: ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist', 'left_hip', 'right_hip', 'left_ankle', 'right_ankle'],
  angles: {
    leftElbow: { a: 'left_shoulder', b: 'left_elbow', c: 'left_wrist' },
    rightElbow: { a: 'right_shoulder', b: 'right_elbow', c: 'right_wrist' }
  },
  thresholds: exerciseThresholds.pushup,
  evaluate: (frame) => evaluateBendAndExtend(frame, pushupExercise, 'Go lower', 'Full lockout not reached')
};

export const shoulderPressExercise: ExerciseDefinition = {
  id: 'shoulder_press',
  label: 'Shoulder press',
  setupHint: 'Face the camera with shoulders, elbows, and wrists visible.',
  trackedJoints: ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist', 'left_hip', 'right_hip'],
  angles: {
    leftElbow: { a: 'left_shoulder', b: 'left_elbow', c: 'left_wrist' },
    rightElbow: { a: 'right_shoulder', b: 'right_elbow', c: 'right_wrist' }
  },
  thresholds: exerciseThresholds.shoulder_press,
  evaluate: (frame) => evaluateBendAndExtend(frame, shoulderPressExercise, 'Lower to shoulder height', 'Press to full lockout')
};

export const bicepCurlExercise: ExerciseDefinition = {
  id: 'bicep_curl',
  label: 'Bicep curl',
  setupHint: 'Stand tall facing the camera with elbows and wrists visible.',
  trackedJoints: ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist', 'left_hip', 'right_hip'],
  angles: {
    leftElbow: { a: 'left_shoulder', b: 'left_elbow', c: 'left_wrist' },
    rightElbow: { a: 'right_shoulder', b: 'right_elbow', c: 'right_wrist' }
  },
  thresholds: exerciseThresholds.bicep_curl,
  evaluate: (frame) => evaluateBendAndExtend(frame, bicepCurlExercise, 'Curl higher', 'Lower all the way')
};

export const lungeExercise: ExerciseDefinition = {
  id: 'lunge',
  label: 'Lunge',
  setupHint: 'Stand side-on or slightly angled with both legs visible.',
  trackedJoints: ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'],
  angles: {
    leftKnee: { a: 'left_hip', b: 'left_knee', c: 'left_ankle' },
    rightKnee: { a: 'right_hip', b: 'right_knee', c: 'right_ankle' }
  },
  thresholds: exerciseThresholds.lunge,
  evaluate: evaluateLunge
};

export const plankExercise: ExerciseDefinition = {
  id: 'plank',
  label: 'Plank',
  setupHint: 'Use a side view with shoulders, hips, and ankles visible.',
  trackedJoints: ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'left_ankle', 'right_ankle'],
  angles: {},
  thresholds: exerciseThresholds.plank,
  evaluate: evaluatePlank
};

function evaluateBendAndExtend(frame: ExerciseFrame, exercise: ExerciseDefinition, depthCue: string, lockoutCue: string): ExerciseEvaluation {
  const thresholds = exercise.thresholds;
  const angle = bilateralAverage([
    angleFromLandmarks(frame.landmarks, exercise.angles.leftElbow, thresholds.confidence),
    angleFromLandmarks(frame.landmarks, exercise.angles.rightElbow, thresholds.confidence)
  ]);
  const messages = [];

  if (angle === null) {
    return { nextPhase: 'idle', validRep: false, partialRep: false, feedback: [feedback('visibility', 'Move into frame', 'warning', 1, true)] };
  }

  const bent = angle <= (thresholds.targetDepthAngle ?? 95);
  const extended = angle >= (thresholds.lockoutAngle ?? 155);
  const bodyLineOff = exercise.id === 'pushup' && isBodyLineOff(frame);

  if (!bent && frame.phase === 'eccentric') messages.push(feedback('depth', depthCue, 'cue', 2, true));
  if (!extended && frame.phase === 'concentric') messages.push(feedback('lockout', lockoutCue, 'cue', 2, true));
  if (bodyLineOff) messages.push(feedback('body_line', 'Keep your body in one line', 'warning', 1, true));

  if (frame.phase === 'idle' && extended) return { nextPhase: 'setup', validRep: false, partialRep: false, feedback: [feedback('ready', 'Ready', 'success', 5)] };
  if (frame.phase === 'setup' && angle < 145) return { nextPhase: 'eccentric', validRep: false, partialRep: false, feedback: messages };
  if (frame.phase === 'eccentric' && bent) return { nextPhase: 'concentric', validRep: false, partialRep: false, feedback: messages };
  if (frame.phase === 'concentric' && extended) {
    const validRep = !bodyLineOff;
    return {
      nextPhase: 'completed',
      validRep,
      partialRep: !validRep,
      feedback: validRep ? [feedback('great_rep', 'Great rep', 'success', 1, true)] : messages
    };
  }

  return { nextPhase: frame.phase === 'idle' ? 'setup' : frame.phase, validRep: false, partialRep: false, feedback: messages };
}

function evaluateLunge(frame: ExerciseFrame): ExerciseEvaluation {
  const thresholds = lungeExercise.thresholds;
  const frontKnee = Math.min(
    angleFromLandmarks(frame.landmarks, lungeExercise.angles.leftKnee, thresholds.confidence) ?? 180,
    angleFromLandmarks(frame.landmarks, lungeExercise.angles.rightKnee, thresholds.confidence) ?? 180
  );
  const messages = [];
  const torsoLean = signedTorsoLeanRatio(frame.landmarks, thresholds.confidence);

  if (frontKnee === 180) return { nextPhase: 'idle', validRep: false, partialRep: false, feedback: [feedback('visibility', 'Show both legs', 'warning', 1, true)] };
  if (torsoLean !== null && torsoLean > (thresholds.torsoLeanRatio ?? 0.48)) messages.push(feedback('torso_lean', 'Stay upright', 'warning', 1, true));

  const down = frontKnee <= (thresholds.targetDepthAngle ?? 105);
  const standing = frontKnee >= (thresholds.standingAngle ?? 158);

  if (!down && frame.phase === 'eccentric') messages.push(feedback('lunge_depth', 'Drop the back knee lower', 'cue', 2, true));
  if (frame.phase === 'idle' && standing) return { nextPhase: 'setup', validRep: false, partialRep: false, feedback: [feedback('ready', 'Ready for lunges', 'success', 5)] };
  if (frame.phase === 'setup' && frontKnee < 145) return { nextPhase: 'eccentric', validRep: false, partialRep: false, feedback: messages };
  if (frame.phase === 'eccentric' && down) return { nextPhase: 'concentric', validRep: false, partialRep: false, feedback: messages };
  if (frame.phase === 'concentric' && standing) return { nextPhase: 'completed', validRep: messages.length === 0, partialRep: messages.length > 0, feedback: messages.length ? messages : [feedback('great_rep', 'Great rep', 'success', 1, true)] };
  return { nextPhase: frame.phase === 'idle' ? 'setup' : frame.phase, validRep: false, partialRep: false, feedback: messages };
}

function evaluatePlank(frame: ExerciseFrame): ExerciseEvaluation {
  const lineOff = isBodyLineOff(frame);
  const started = !lineOff;
  const elapsed = frame.repStartedAt ? (frame.timestamp - frame.repStartedAt) / 1000 : 0;
  const target = plankExercise.thresholds.plankHoldSeconds ?? 30;

  if (lineOff) {
    return {
      nextPhase: 'setup',
      validRep: false,
      partialRep: false,
      feedback: [feedback('body_line', 'Level your hips', 'warning', 1, true)]
    };
  }

  if (frame.phase === 'idle' || frame.phase === 'setup') {
    return { nextPhase: 'eccentric', validRep: false, partialRep: false, feedback: [feedback('hold', 'Hold strong', 'success', 4)] };
  }

  if (started && elapsed >= target) {
    return { nextPhase: 'completed', validRep: true, partialRep: false, feedback: [feedback('plank_complete', 'Plank complete', 'success', 1, true)] };
  }

  return { nextPhase: 'eccentric', validRep: false, partialRep: false, feedback: [feedback('hold', `Hold: ${Math.floor(elapsed)}s`, 'cue', 5)] };
}

function isBodyLineOff(frame: ExerciseFrame): boolean {
  const leftShoulder = getPoint(frame.landmarks, 'left_shoulder');
  const rightShoulder = getPoint(frame.landmarks, 'right_shoulder');
  const leftHip = getPoint(frame.landmarks, 'left_hip');
  const rightHip = getPoint(frame.landmarks, 'right_hip');
  const leftAnkle = getPoint(frame.landmarks, 'left_ankle');
  const rightAnkle = getPoint(frame.landmarks, 'right_ankle');
  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip || !leftAnkle || !rightAnkle) return false;

  const shoulder = midpoint(leftShoulder, rightShoulder);
  const hip = midpoint(leftHip, rightHip);
  const ankle = midpoint(leftAnkle, rightAnkle);
  const shoulderHip = lineAngleDeg(shoulder, hip);
  const shoulderAnkle = lineAngleDeg(shoulder, ankle);
  return Math.abs(shoulderHip - shoulderAnkle) > (frame.phase === 'idle' ? 25 : 18);
}
