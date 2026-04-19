import { describe, expect, it } from 'vitest';
import { calculateAngle, pointDistance, smoothLandmarks } from './poseUtils';

describe('pose utilities', () => {
  it('calculates a right angle', () => {
    const angle = calculateAngle({ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 });
    expect(angle).toBeCloseTo(90, 4);
  });

  it('calculates point distance', () => {
    expect(pointDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('smooths landmarks without losing confidence', () => {
    const smoothed = smoothLandmarks(
      { left_knee: { name: 'left_knee', x: 0, y: 0, score: 0.9 } },
      { left_knee: { name: 'left_knee', x: 10, y: 10, score: 0.8 } },
      0.5
    );

    expect(smoothed.left_knee?.x).toBe(5);
    expect(smoothed.left_knee?.score).toBe(0.8);
  });
});
