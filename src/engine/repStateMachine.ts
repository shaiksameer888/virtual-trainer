import { selectTopFeedback } from './feedbackEngine';
import type {
  ExerciseDefinition,
  FeedbackMessage,
  MovementPhase,
  SessionStats
} from '../types/exercise';
import type { PoseLandmarks } from '../types/pose';

export interface RepMachineSnapshot {
  phase: MovementPhase;
  reps: number;
  validReps: number;
  partialReps: number;
  feedback: FeedbackMessage[];
  stats: SessionStats;
  quality: number;
  currentRepStartedAt?: number;
}

interface RepMachineState {
  phase: MovementPhase;
  framesInPhase: number;
  currentRepStartedAt?: number;
  validReps: number;
  partialReps: number;
  repDurations: number[];
  issueCounts: Record<string, number>;
  feedback: FeedbackMessage[];
}

export class RepStateMachine {
  private state: RepMachineState = {
    phase: 'idle',
    framesInPhase: 0,
    validReps: 0,
    partialReps: 0,
    repDurations: [],
    issueCounts: {},
    feedback: []
  };

  constructor(private exercise: ExerciseDefinition) {}

  reset(exercise = this.exercise): void {
    this.exercise = exercise;
    this.state = {
      phase: 'idle',
      framesInPhase: 0,
      validReps: 0,
      partialReps: 0,
      repDurations: [],
      issueCounts: {},
      feedback: []
    };
  }

  update(landmarks: PoseLandmarks, timestamp: number): RepMachineSnapshot {
    const result = this.exercise.evaluate({
      landmarks,
      timestamp,
      phase: this.state.phase,
      repStartedAt: this.state.currentRepStartedAt,
      framesInPhase: this.state.framesInPhase
    });

    const nextPhase = this.canTransition(result.nextPhase) ? result.nextPhase : this.state.phase;
    const changedPhase = nextPhase !== this.state.phase;
    const completedRep = changedPhase && nextPhase === 'completed';

    if (changedPhase) {
      this.state.framesInPhase = 0;
      if (nextPhase === 'eccentric') {
        this.state.currentRepStartedAt = timestamp;
      }
    } else {
      this.state.framesInPhase += 1;
    }

    if (completedRep) {
      const duration = this.state.currentRepStartedAt ? timestamp - this.state.currentRepStartedAt : 0;
      const tempoOk =
        this.exercise.id === 'plank' ||
        (duration >= this.exercise.thresholds.minRepMs && duration <= this.exercise.thresholds.maxRepMs);

      if (result.validRep && tempoOk) {
        this.state.validReps += 1;
        this.state.repDurations.push(duration);
      } else {
        this.state.partialReps += 1;
      }
      this.state.currentRepStartedAt = undefined;
    }

    result.feedback.forEach((item) => {
      if (item.kind === 'warning' || item.kind === 'cue') {
        this.state.issueCounts[item.id] = (this.state.issueCounts[item.id] ?? 0) + 1;
      }
    });

    this.state.phase = nextPhase === 'completed' ? 'setup' : nextPhase;
    this.state.feedback = selectTopFeedback(result.feedback);

    return this.snapshot(timestamp);
  }

  snapshot(timestamp = performance.now()): RepMachineSnapshot {
    const totalReps = this.state.validReps + this.state.partialReps;
    const averageTempoSeconds = this.state.repDurations.length
      ? this.state.repDurations.reduce((sum, duration) => sum + duration, 0) / this.state.repDurations.length / 1000
      : 0;
    const holdSeconds =
      this.exercise.id === 'plank' && this.state.currentRepStartedAt
        ? Math.max(0, (timestamp - this.state.currentRepStartedAt) / 1000)
        : undefined;

    return {
      phase: this.state.phase,
      reps: totalReps,
      validReps: this.state.validReps,
      partialReps: this.state.partialReps,
      feedback: this.state.feedback,
      quality: this.calculateQuality(),
      currentRepStartedAt: this.state.currentRepStartedAt,
      stats: {
        totalReps,
        validReps: this.state.validReps,
        partialReps: this.state.partialReps,
        averageTempoSeconds,
        issueCounts: this.state.issueCounts,
        tips: buildTips(this.state.issueCounts),
        holdSeconds
      }
    };
  }

  private canTransition(nextPhase: MovementPhase): boolean {
    if (nextPhase === this.state.phase) return false;
    if (this.state.phase === 'idle') return true;
    if (this.state.framesInPhase < this.exercise.thresholds.minPhaseFrames) return false;
    return true;
  }

  private calculateQuality(): number {
    const issueTotal = Object.values(this.state.issueCounts).reduce((sum, count) => sum + count, 0);
    const repBonus = Math.min(20, this.state.validReps * 3);
    return Math.max(0, Math.min(100, 82 + repBonus - issueTotal * 2 - this.state.partialReps * 8));
  }
}

function buildTips(issueCounts: Record<string, number>): string[] {
  const issueTips: Record<string, string> = {
    squat_depth: 'Reach consistent depth before driving up.',
    torso_lean: 'Brace your core and keep the chest proud.',
    knee_valgus: 'Push knees outward in line with toes.',
    tempo_fast: 'Slow down the rep and own both directions.',
    body_line: 'Keep shoulders, hips, and ankles stacked in one line.',
    lockout: 'Finish each rep with a controlled lockout.'
  };

  return Object.entries(issueCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([id]) => issueTips[id] ?? 'Keep the movement controlled and repeatable.');
}
