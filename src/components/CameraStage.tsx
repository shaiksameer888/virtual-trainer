import type { RefObject } from 'react';
import type { PoseMetrics } from '../types/pose';

interface CameraStageProps {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  status: string;
  error: string | null;
  isCalibrated: boolean;
  metrics: PoseMetrics;
  setupHint: string;
}

export function CameraStage({ videoRef, canvasRef, status, error, isCalibrated, metrics, setupHint }: CameraStageProps) {
  const readiness = Math.round(metrics.visibleRatio * 100);

  return (
    <section className="camera-stage" aria-label="Live trainer camera">
      <video ref={videoRef} className="camera-video" playsInline muted />
      <canvas ref={canvasRef} className="pose-canvas" />
      <div className="camera-shade" />
      <div className="readiness-panel">
        <span className={isCalibrated ? 'dot ready' : 'dot'} />
        <div>
          <strong>{isCalibrated ? 'Tracking' : status === 'loading-model' ? 'Loading model' : 'Calibration'}</strong>
          <p>{isCalibrated ? 'Move when ready.' : setupHint}</p>
        </div>
      </div>
      <div className="visibility-meter" aria-label="Pose visibility">
        <span style={{ width: `${readiness}%` }} />
      </div>
      {error && <div className="stage-error">{error}</div>}
    </section>
  );
}
