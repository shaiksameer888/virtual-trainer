import { getPoint } from './poseUtils';
import { skeletonPairs } from './poseDetection';
import type { PoseLandmarks } from '../types/pose';

export function drawPoseOverlay(ctx: CanvasRenderingContext2D, landmarks: PoseLandmarks, width: number, height: number): void {
  ctx.clearRect(0, 0, width, height);
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  for (const [from, to] of skeletonPairs) {
    const a = getPoint(landmarks, from);
    const b = getPoint(landmarks, to);
    if (!a || !b) continue;

    ctx.strokeStyle = 'rgba(109, 240, 194, 0.9)';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  Object.values(landmarks).forEach((point) => {
    if (point.score < 0.35) return;
    ctx.fillStyle = point.score > 0.55 ? '#6df0c2' : '#ffd166';
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}
