import type { AngleTriplet, LandmarkName, PoseLandmarks, PoseMetrics, PosePoint } from '../types/pose';

export function getPoint(landmarks: PoseLandmarks, name: LandmarkName, minScore = 0.35): PosePoint | null {
  const point = landmarks[name];
  if (!point || point.score < minScore) return null;
  return point;
}

export function calculateAngle(a: Pick<PosePoint, 'x' | 'y'>, b: Pick<PosePoint, 'x' | 'y'>, c: Pick<PosePoint, 'x' | 'y'>): number {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.hypot(ab.x, ab.y);
  const magCB = Math.hypot(cb.x, cb.y);

  if (magAB === 0 || magCB === 0) return 0;

  // Clamp because floating point drift can push acos slightly outside [-1, 1].
  const cosine = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
  return (Math.acos(cosine) * 180) / Math.PI;
}

export function angleFromLandmarks(
  landmarks: PoseLandmarks,
  triplet: AngleTriplet,
  minScore = 0.35
): number | null {
  const a = getPoint(landmarks, triplet.a, minScore);
  const b = getPoint(landmarks, triplet.b, minScore);
  const c = getPoint(landmarks, triplet.c, minScore);
  if (!a || !b || !c) return null;
  return calculateAngle(a, b, c);
}

export function pointDistance(a: Pick<PosePoint, 'x' | 'y'>, b: Pick<PosePoint, 'x' | 'y'>): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function midpoint(a: PosePoint, b: PosePoint, name: LandmarkName = a.name): PosePoint {
  return {
    name,
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    score: Math.min(a.score, b.score)
  };
}

export function smoothLandmarks(previous: PoseLandmarks | null, next: PoseLandmarks, alpha = 0.55): PoseLandmarks {
  if (!previous) return next;

  const smoothed: PoseLandmarks = {};
  for (const [name, point] of Object.entries(next) as [LandmarkName, PosePoint][]) {
    const old = previous[name];
    smoothed[name] = old
      ? {
          ...point,
          x: old.x * (1 - alpha) + point.x * alpha,
          y: old.y * (1 - alpha) + point.y * alpha,
          score: point.score
        }
      : point;
  }
  return smoothed;
}

export function computePoseMetrics(landmarks: PoseLandmarks, required: LandmarkName[], minScore = 0.35): PoseMetrics {
  const values = Object.values(landmarks);
  const confidence = values.length ? values.reduce((sum, point) => sum + point.score, 0) / values.length : 0;
  const visibleRequired = required.filter((name) => getPoint(landmarks, name, minScore)).length;
  const visibleRatio = required.length ? visibleRequired / required.length : 0;

  return {
    confidence,
    visibleRatio,
    fullBodyVisible: visibleRatio >= 0.86
  };
}

export function signedTorsoLeanRatio(landmarks: PoseLandmarks, minScore = 0.35): number | null {
  const leftShoulder = getPoint(landmarks, 'left_shoulder', minScore);
  const rightShoulder = getPoint(landmarks, 'right_shoulder', minScore);
  const leftHip = getPoint(landmarks, 'left_hip', minScore);
  const rightHip = getPoint(landmarks, 'right_hip', minScore);
  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return null;

  const shoulder = midpoint(leftShoulder, rightShoulder);
  const hip = midpoint(leftHip, rightHip);
  const torsoLength = Math.max(1, pointDistance(shoulder, hip));
  return Math.abs(shoulder.x - hip.x) / torsoLength;
}

export function lineAngleDeg(a: Pick<PosePoint, 'x' | 'y'>, b: Pick<PosePoint, 'x' | 'y'>): number {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

export function bilateralAverage(values: Array<number | null>): number | null {
  const valid = values.filter((value): value is number => value !== null);
  if (!valid.length) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}
