import type { ExerciseId, ExerciseThresholds } from '../types/exercise';

export const exerciseThresholds: Record<ExerciseId, ExerciseThresholds> = {
  squat: {
    confidence: 0.45,
    minPhaseFrames: 4,
    minRepMs: 900,
    maxRepMs: 6000,
    targetDepthAngle: 105,
    standingAngle: 160,
    torsoLeanRatio: 0.42
  },
  pushup: {
    confidence: 0.45,
    minPhaseFrames: 4,
    minRepMs: 800,
    maxRepMs: 5000,
    targetDepthAngle: 95,
    lockoutAngle: 155,
    bodyLineToleranceDeg: 18
  },
  shoulder_press: {
    confidence: 0.45,
    minPhaseFrames: 4,
    minRepMs: 900,
    maxRepMs: 6000,
    targetDepthAngle: 95,
    lockoutAngle: 155
  },
  bicep_curl: {
    confidence: 0.45,
    minPhaseFrames: 4,
    minRepMs: 700,
    maxRepMs: 4500,
    targetDepthAngle: 65,
    lockoutAngle: 150
  },
  lunge: {
    confidence: 0.45,
    minPhaseFrames: 5,
    minRepMs: 1000,
    maxRepMs: 6500,
    targetDepthAngle: 105,
    standingAngle: 158,
    torsoLeanRatio: 0.48
  },
  plank: {
    confidence: 0.45,
    minPhaseFrames: 8,
    minRepMs: 0,
    maxRepMs: 0,
    bodyLineToleranceDeg: 14,
    plankHoldSeconds: 30
  }
};
