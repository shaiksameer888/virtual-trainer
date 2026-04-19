# Virtual Trainer

Virtual Trainer is a production-minded MVP for browser-based exercise tracking. It uses a webcam, in-browser pose estimation, rule-based biomechanics, a rep state machine, and real-time coaching feedback.

## Recommended MVP Stack

- React + Vite + TypeScript for fast iteration and strong client-side types.
- TensorFlow.js pose-detection with MoveNet Lightning for low-latency browser inference.
- Rule-based exercise engines for transparent biomechanics logic.
- Vitest for unit tests around math and rep counting.
- No backend for the MVP. A FastAPI service can be added later for workout history, cloud analytics, trainer dashboards, or server-side model inference.

Tradeoff: MoveNet Lightning is fast and practical for a live MVP, but it is less detailed than heavier pose models and can struggle in poor light, unusual camera angles, or partial occlusion. The engine is intentionally modular so MediaPipe Pose, MoveNet Thunder, or a custom ML scoring model can replace the detector/evaluator later.

## Folder Structure

```text
src/
  components/          UI pieces: camera stage, feedback cards, selector, summary
  config/              Exercise thresholds and tuning values
  engine/              Exercise definitions, feedback ranking, rep state machine
  engine/exercises/    Squat, push-up, shoulder press, curl, lunge, plank logic
  hooks/               React hooks for webcam, pose loop, and trainer state
  pose/                Pose detection adapter, drawing, math utilities
  types/               Shared TypeScript interfaces
  utils/               Browser helpers such as speech synthesis
  test/                Test setup
```

## Implementation Plan

1. Create the Vite + React + TypeScript scaffold.
2. Add pose utilities for angles, distances, smoothing, and confidence filtering.
3. Add an exercise engine abstraction with thresholds and exercise-specific evaluators.
4. Add a rep state machine with phase gating to avoid noisy counting.
5. Add the live webcam and MoveNet inference loop.
6. Draw skeleton and landmarks on a canvas overlay.
7. Add calibration, feedback prioritization, voice coaching, and summary stats.
8. Add tests for angle calculation and squat rep validation.
9. Add manual QA checks for camera, visibility, shallow reps, tempo, and exercise switching.

## Local Setup

```bash
npm install
npm run dev
```

Open the local URL shown by Vite. Grant camera permission, choose an exercise, stand clearly in frame, and begin moving after calibration turns ready.

## Testing

```bash
npm test
npm run build
```

Current unit coverage focuses on:

- angle calculation
- distance and smoothing utilities
- squat rep completion through the state machine
- shallow squat rejection

## How Exercise Logic Works

Each exercise defines:

- tracked joints required for calibration
- landmark triplets used to compute joint angles
- thresholds for depth, lockout, tempo, and posture
- an evaluator that receives the current frame and returns the next movement phase, rep validity, and feedback

The state machine moves through:

- `idle`
- `setup`
- `eccentric`
- `concentric`
- `completed`

Phase changes are gated by minimum frame duration. This avoids counting jitter from one or two noisy frames.

## MVP Exercise Notes

- Squat: knee flexion depth, standing lockout, torso lean, and rough front-view knee valgus.
- Push-up: elbow depth, elbow lockout, and shoulder-hip-ankle line.
- Shoulder press: elbow bend and overhead lockout.
- Bicep curl: elbow flexion and controlled return.
- Lunge: front knee depth and torso posture.
- Plank: static body-line hold duration.

## Error States

The app handles:

- camera permission denied
- unsupported webcam APIs
- poor visibility during calibration
- low landmark confidence
- user partially out of frame
- no movement detected through persistent setup state

## Limitations

- Single-camera pose estimation cannot perfectly infer depth or rotation.
- Knee valgus detection is an approximation and works best with a front-facing angle.
- Plank and push-up body-line checks depend on side-view camera placement.
- This MVP does not store history or personalize thresholds yet.

## Future Improvements

- personalized thresholds by user height, mobility, and experience
- workout history and progress trends
- body composition and body fat estimation module
- trainer dashboard
- cloud analytics
- multi-angle camera input
- server-side model inference
- ML-based form scoring plugged into the existing exercise engine
