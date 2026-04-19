import type { FeedbackMessage, MovementPhase } from '../types/exercise';

interface FeedbackPanelProps {
  feedback: FeedbackMessage[];
  phase: MovementPhase;
  quality: number;
}

export function FeedbackPanel({ feedback, phase, quality }: FeedbackPanelProps) {
  return (
    <section className="panel feedback-panel">
      <div className="panel-heading">
        <span>Live coaching</span>
        <strong>{quality}%</strong>
      </div>
      <div className="quality-track">
        <span style={{ width: `${quality}%` }} />
      </div>
      <p className="phase">Phase: {phase}</p>
      <div className="feedback-list">
        {feedback.length ? (
          feedback.map((item) => (
            <article className={`feedback-card ${item.kind}`} key={`${item.id}-${item.message}`}>
              <span>{item.kind}</span>
              <strong>{item.message}</strong>
            </article>
          ))
        ) : (
          <article className="feedback-card neutral">
            <span>cue</span>
            <strong>Get into position</strong>
          </article>
        )}
      </div>
    </section>
  );
}
