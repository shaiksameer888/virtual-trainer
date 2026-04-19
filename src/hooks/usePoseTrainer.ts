import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import type { PoseDetector } from '@tensorflow-models/pose-detection';
import { createPoseDetector, normalizePose } from '../pose/poseDetection';
import { drawPoseOverlay } from '../pose/drawPose';
import { computePoseMetrics, smoothLandmarks } from '../pose/poseUtils';
import { RepStateMachine, type RepMachineSnapshot } from '../engine/repStateMachine';
import { exercises } from '../engine/exercises';
import type { ExerciseId, FeedbackMessage } from '../types/exercise';
import type { PoseLandmarks, PoseMetrics } from '../types/pose';
import { speakFeedback } from '../utils/speech';

type TrainerStatus = 'idle' | 'loading-model' | 'camera-ready' | 'calibrating' | 'tracking' | 'error';

interface UsePoseTrainerResult {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  status: TrainerStatus;
  error: string | null;
  metrics: PoseMetrics;
  snapshot: RepMachineSnapshot;
  isCalibrated: boolean;
  lastFeedbackKey: string;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  resetSet: () => void;
}

const emptyMetrics: PoseMetrics = {
  confidence: 0,
  visibleRatio: 0,
  fullBodyVisible: false
};

export function usePoseTrainer(exerciseId: ExerciseId, voiceEnabled: boolean): UsePoseTrainerResult {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<PoseDetector | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const smoothedRef = useRef<PoseLandmarks | null>(null);
  const lastFeedbackRef = useRef<string>('');
  const calibrationFramesRef = useRef(0);
  const machineRef = useRef(new RepStateMachine(exercises[exerciseId]));

  const [status, setStatus] = useState<TrainerStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<PoseMetrics>(emptyMetrics);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [lastFeedbackKey, setLastFeedbackKey] = useState('');
  const [snapshot, setSnapshot] = useState<RepMachineSnapshot>(() => machineRef.current.snapshot());

  const exercise = useMemo(() => exercises[exerciseId], [exerciseId]);

  const resetSet = useCallback(() => {
    machineRef.current.reset(exercise);
    calibrationFramesRef.current = 0;
    smoothedRef.current = null;
    setIsCalibrated(false);
    setMetrics(emptyMetrics);
    setSnapshot(machineRef.current.snapshot());
  }, [exercise]);

  useEffect(() => {
    resetSet();
  }, [resetSet]);

  const stopCamera = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    detectorRef.current?.dispose();
    detectorRef.current = null;
    setStatus('idle');
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const updateFeedbackSpeech = useCallback(
    (items: FeedbackMessage[]) => {
      const firstSpeakable = items.find((item) => item.speak) ?? items[0];
      if (!firstSpeakable) return;

      const key = `${firstSpeakable.id}-${firstSpeakable.message}`;
      if (lastFeedbackRef.current === key) return;
      lastFeedbackRef.current = key;
      setLastFeedbackKey(key);
      speakFeedback(firstSpeakable, voiceEnabled);
    },
    [voiceEnabled]
  );

  const runLoop = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const detector = detectorRef.current;
    if (!video || !canvas || !detector || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      frameRef.current = requestAnimationFrame(() => void runLoop());
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const poses = await detector.estimatePoses(video, { flipHorizontal: false });
    const raw = normalizePose(poses[0]);
    const smoothed = smoothLandmarks(smoothedRef.current, raw);
    smoothedRef.current = smoothed;

    const nextMetrics = computePoseMetrics(smoothed, exercise.trackedJoints, exercise.thresholds.confidence);
    const ctx = canvas.getContext('2d');
    if (ctx) drawPoseOverlay(ctx, smoothed, width, height);

    if (nextMetrics.fullBodyVisible && nextMetrics.confidence >= exercise.thresholds.confidence) {
      calibrationFramesRef.current += 1;
    } else {
      calibrationFramesRef.current = Math.max(0, calibrationFramesRef.current - 1);
    }

    const ready = calibrationFramesRef.current > 24;
    setIsCalibrated(ready);
    setMetrics(nextMetrics);

    if (!ready) {
      setStatus('calibrating');
    } else {
      setStatus('tracking');
      const nextSnapshot = machineRef.current.update(smoothed, performance.now());
      setSnapshot(nextSnapshot);
      updateFeedbackSpeech(nextSnapshot.feedback);
    }

    frameRef.current = requestAnimationFrame(() => void runLoop());
  }, [exercise, updateFeedbackSpeech]);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser does not support webcam access.');
      setStatus('error');
      return;
    }

    try {
      setError(null);
      setStatus('loading-model');
      detectorRef.current = detectorRef.current ?? (await createPoseDetector());

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStatus('camera-ready');
      frameRef.current = requestAnimationFrame(() => void runLoop());
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Camera permission denied. Allow webcam access to start tracking.'
          : 'Could not start camera or pose model. Check permissions and try again.';
      setError(message);
      setStatus('error');
    }
  }, [runLoop]);

  return {
    videoRef,
    canvasRef,
    status,
    error,
    metrics,
    snapshot,
    isCalibrated,
    lastFeedbackKey,
    startCamera,
    stopCamera,
    resetSet
  };
}
