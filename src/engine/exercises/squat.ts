import { exerciseThresholds } from '../../config/exerciseThresholds';
import { feedback } from '../feedbackEngine';
import { angleFromLandmarks, bilateralAverage, getPoint, signedTorsoLeanRatio } from '../../pose/poseUtils';
import type { ExerciseDefinition, ExerciseEvaluation, ExerciseFrame } from '../../types/exercise';

const thresholds = exerciseThresholds.squat;

export const squatExercise: ExerciseDefinition = {
  id: 'squat',
  label: 'Squat',
  setupHint: 'Stand side-on or at a slight angle with hips, knees, and ankles visible.',
  trackedJoints: ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'],
  angles: {
    leftKnee: { a: 'left_hip', b: 'left_knee', c: 'left_ankle' },
    rightKnee: { a: 'right_hip', b: 'right_knee', c: 'right_ankle' }
  },
  thresholds,
  evaluate: evaluateSquat
};

function evaluateSquat(frame: ExerciseFrame): ExerciseEvaluation {
  const leftKnee = angleFromLandmarks(frame.landmarks, squatExercise.angles.leftKnee, thresholds.confidence);
  const rightKnee = angleFromLandmarks(frame.landmarks, squatExercise.angles.rightKnee, thresholds.confidence);
  const kneeAngle = bilateralAverage([leftKnee, rightKnee]);
  const messages = [];

  if (kneeAngle === null) {
    return {
      nextPhase: 'idle',
      validRep: false,
      partialRep: false,
      feedback: [feedback('visibility', 'Step fully into frame', 'warning', 1, true)]
    };
  }

  const isStanding = kneeAngle >= (thresholds.standingAngle ?? 160);
  const reachedDepth = kneeAngle <= (thresholds.targetDepthAngle ?? 105);
  const torsoLean = signedTorsoLeanRatio(frame.landmarks, thresholds.confidence);
  const kneesCaving = detectKneeValgus(frame);

  if (!reachedDepth && frame.phase === 'eccentric') {
    messages.push(feedback('squat_depth', 'Go lower', 'cue', 2, true));
  }

  if (torsoLean !== null && torsoLean > (thresholds.torsoLeanRatio ?? 0.42)) {
    messages.push(feedback('torso_lean', 'Keep your chest up', 'warning', 1, true));
  }

  if (kneesCaving) {
    messages.push(feedback('knee_valgus', 'Drive knees out', 'warning', 1, true));
  }

  if (frame.repStartedAt && frame.timestamp - frame.repStartedAt < thresholds.minRepMs && frame.phase === 'concentric') {
    messages.push(feedback('tempo_fast', 'Too fast, control the movement', 'cue', 3, true));
  }

  if (frame.phase === 'idle' && isStanding) {
    return { nextPhase: 'setup', validRep: false, partialRep: false, feedback: [feedback('ready', 'Ready for squats', 'success', 5)] };
  }

  if ((frame.phase === 'setup' || frame.phase === 'completed') && kneeAngle < 145) {
    return { nextPhase: 'eccentric', validRep: false, partialRep: false, feedback: messages };
  }

  if (frame.phase === 'eccentric' && reachedDepth) {
    return { nextPhase: 'concentric', validRep: false, partialRep: false, feedback: [feedback('depth', 'Depth reached', 'success', 5), ...messages] };
  }

  if (frame.phase === 'concentric' && isStanding) {
    const validRep = !messages.some((item) => item.kind === 'warning');
    return {
      nextPhase: 'completed',
      validRep,
      partialRep: !validRep,
      feedback: validRep ? [feedback('great_rep', 'Great rep', 'success', 1, true)] : messages
    };
  }

  return { nextPhase: frame.phase === 'idle' ? 'setup' : frame.phase, validRep: false, partialRep: false, feedback: messages };
}

function detectKneeValgus(frame: ExerciseFrame): boolean {
  const leftKnee = getPoint(frame.landmarks, 'left_knee');
  const rightKnee = getPoint(frame.landmarks, 'right_knee');
  const leftAnkle = getPoint(frame.landmarks, 'left_ankle');
  const rightAnkle = getPoint(frame.landmarks, 'right_ankle');
  const leftHip = getPoint(frame.landmarks, 'left_hip');
  const rightHip = getPoint(frame.landmarks, 'right_hip');
  if (!leftKnee || !rightKnee || !leftAnkle || !rightAnkle || !leftHip || !rightHip) return false;

  const ankleWidth = Math.abs(leftAnkle.x - rightAnkle.x);
  const kneeWidth = Math.abs(leftKnee.x - rightKnee.x);
  const hipWidth = Math.abs(leftHip.x - rightHip.x);

  // Front-facing approximation: knees should not collapse far inside both ankles and hips.
  return ankleWidth > 40 && kneeWidth < Math.min(ankleWidth, hipWidth) * 0.72;
}
