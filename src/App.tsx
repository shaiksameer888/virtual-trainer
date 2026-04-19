import { useMemo, useState } from 'react';
import { CameraStage } from './components/CameraStage';
import { ExerciseSelector } from './components/ExerciseSelector';
import { FeedbackPanel } from './components/FeedbackPanel';
import { ManualChecklist } from './components/ManualChecklist';
import { RepCounter } from './components/RepCounter';
import { SessionSummary } from './components/SessionSummary';
import { exercises } from './engine/exercises';
import { usePoseTrainer } from './hooks/usePoseTrainer';
import type { ExerciseId } from './types/exercise';

export default function App() {
  const [exerciseId, setExerciseId] = useState<ExerciseId>('squat');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const exercise = useMemo(() => exercises[exerciseId], [exerciseId]);
  const trainer = usePoseTrainer(exerciseId, voiceEnabled);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Virtual Trainer</p>
          <h1>Real-time form coaching from your webcam.</h1>
        </div>
        <div className="top-actions">
          <button type="button" className="secondary" onClick={() => setVoiceEnabled((value) => !value)}>
            Voice {voiceEnabled ? 'on' : 'off'}
          </button>
          <button type="button" onClick={trainer.status === 'idle' ? trainer.startCamera : trainer.stopCamera}>
            {trainer.status === 'idle' ? 'Start camera' : 'Stop'}
          </button>
        </div>
      </header>

      <section className="hero-strip" aria-label="Training focus">
        <img
          src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80"
          alt="Athlete training with weights"
        />
        <div>
          <span>Fast MVP stack</span>
          <p>React, MoveNet, rule-based biomechanics, and clean hooks for future model scoring.</p>
        </div>
      </section>

      <div className="workspace">
        <CameraStage
          videoRef={trainer.videoRef}
          canvasRef={trainer.canvasRef}
          status={trainer.status}
          error={trainer.error}
          isCalibrated={trainer.isCalibrated}
          metrics={trainer.metrics}
          setupHint={exercise.setupHint}
        />

        <aside className="side-rail">
          <ExerciseSelector value={exerciseId} onChange={setExerciseId} />
          <RepCounter
            reps={trainer.snapshot.reps}
            validReps={trainer.snapshot.validReps}
            partialReps={trainer.snapshot.partialReps}
            holdSeconds={trainer.snapshot.stats.holdSeconds}
          />
          <FeedbackPanel feedback={trainer.snapshot.feedback} phase={trainer.snapshot.phase} quality={trainer.snapshot.quality} />
          <section className="panel metrics-panel">
            <div className="panel-heading">
              <span>Readiness</span>
              <strong>{Math.round(trainer.metrics.confidence * 100)}%</strong>
            </div>
            <p>Visibility: {Math.round(trainer.metrics.visibleRatio * 100)}%</p>
            <p>{trainer.isCalibrated ? 'Full body tracked.' : 'Stand clearly in frame before starting.'}</p>
          </section>
          <div className="button-row">
            <button type="button" className="secondary" onClick={trainer.resetSet}>
              Reset set
            </button>
            <button type="button" onClick={() => setSummaryOpen(true)}>
              End set
            </button>
          </div>
        </aside>
      </div>

      <ManualChecklist />
      <SessionSummary stats={trainer.snapshot.stats} open={summaryOpen} onClose={() => setSummaryOpen(false)} />
    </main>
  );
}
