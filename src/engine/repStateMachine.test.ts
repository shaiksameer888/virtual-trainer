import { describe, expect, it } from 'vitest';
import { RepStateMachine } from './repStateMachine';
import { squatExercise } from './exercises/squat';
import type { PoseLandmarks } from '../types/pose';

function standingPose(): PoseLandmarks {
  return {
    left_shoulder: point('left_shoulder', 100, 40),
    right_shoulder: point('right_shoulder', 200, 40),
    left_hip: point('left_hip', 100, 100),
    right_hip: point('right_hip', 200, 100),
    left_knee: point('left_knee', 100, 200),
    right_knee: point('right_knee', 200, 200),
    left_ankle: point('left_ankle', 100, 300),
    right_ankle: point('right_ankle', 200, 300)
  };
}

function deepSquatPose(): PoseLandmarks {
  return {
    ...standingPose(),
    left_knee: point('left_knee', 100, 200),
    right_knee: point('right_knee', 200, 200),
    left_ankle: point('left_ankle', 200, 200),
    right_ankle: point('right_ankle', 100, 200)
  };
}

function shallowSquatPose(): PoseLandmarks {
  return {
    ...standingPose(),
    left_ankle: point('left_ankle', 150, 285),
    right_ankle: point('right_ankle', 150, 285)
  };
}

describe('rep state machine squat flow', () => {
  it('counts a full squat only after down and return to standing', () => {
    const machine = new RepStateMachine(squatExercise);
    let time = 0;

    repeat(standingPose(), 6, () => (time += 100), machine);
    repeat(deepSquatPose(), 6, () => (time += 160), machine);
    repeat(standingPose(), 8, () => (time += 160), machine);

    const snapshot = machine.snapshot(time);
    expect(snapshot.validReps).toBe(1);
    expect(snapshot.partialReps).toBe(0);
  });

  it('does not count shallow movement as a valid squat', () => {
    const machine = new RepStateMachine(squatExercise);
    let time = 0;

    repeat(standingPose(), 6, () => (time += 100), machine);
    repeat(shallowSquatPose(), 6, () => (time += 160), machine);
    repeat(standingPose(), 8, () => (time += 160), machine);

    const snapshot = machine.snapshot(time);
    expect(snapshot.validReps).toBe(0);
  });
});

function repeat(pose: PoseLandmarks, frames: number, nextTime: () => number, machine: RepStateMachine): void {
  for (let index = 0; index < frames; index += 1) {
    machine.update(pose, nextTime());
  }
}

function point(name: keyof PoseLandmarks, x: number, y: number) {
  return { name, x, y, score: 0.9 };
}
