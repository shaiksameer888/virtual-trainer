export type LandmarkName =
  | 'nose'
  | 'left_eye'
  | 'right_eye'
  | 'left_ear'
  | 'right_ear'
  | 'left_shoulder'
  | 'right_shoulder'
  | 'left_elbow'
  | 'right_elbow'
  | 'left_wrist'
  | 'right_wrist'
  | 'left_hip'
  | 'right_hip'
  | 'left_knee'
  | 'right_knee'
  | 'left_ankle'
  | 'right_ankle';

export interface PosePoint {
  name: LandmarkName;
  x: number;
  y: number;
  score: number;
}

export type PoseLandmarks = Partial<Record<LandmarkName, PosePoint>>;

export interface AngleTriplet {
  a: LandmarkName;
  b: LandmarkName;
  c: LandmarkName;
}

export interface PoseMetrics {
  confidence: number;
  visibleRatio: number;
  fullBodyVisible: boolean;
}
