import type { AngleTriplet, LandmarkName, PoseLandmarks } from './pose';

export type ExerciseId = 'squat' | 'pushup' | 'shoulder_press' | 'bicep_curl' | 'lunge' | 'plank';
export type MovementPhase = 'idle' | 'setup' | 'eccentric' | 'concentric' | 'completed';
export type FeedbackKind = 'warning' | 'cue' | 'success';

export interface FeedbackMessage {
  id: string;
  message: string;
  kind: FeedbackKind;
  priority: number;
  speak?: boolean;
}

export interface ExerciseThresholds {
  confidence: number;
  minPhaseFrames: number;
  minRepMs: number;
  maxRepMs: number;
  targetDepthAngle?: number;
  standingAngle?: number;
  lockoutAngle?: number;
  torsoLeanRatio?: number;
  bodyLineToleranceDeg?: number;
  plankHoldSeconds?: number;
}

export interface ExerciseFrame {
  landmarks: PoseLandmarks;
  timestamp: number;
  phase: MovementPhase;
  repStartedAt?: number;
  framesInPhase: number;
}

export interface ExerciseEvaluation {
  nextPhase: MovementPhase;
  validRep: boolean;
  partialRep: boolean;
  feedback: FeedbackMessage[];
}

export interface ExerciseDefinition {
  id: ExerciseId;
  label: string;
  setupHint: string;
  trackedJoints: LandmarkName[];
  angles: Record<string, AngleTriplet>;
  thresholds: ExerciseThresholds;
  evaluate: (frame: ExerciseFrame) => ExerciseEvaluation;
}

export interface SessionStats {
  totalReps: number;
  validReps: number;
  partialReps: number;
  averageTempoSeconds: number;
  issueCounts: Record<string, number>;
  tips: string[];
  holdSeconds?: number;
}
