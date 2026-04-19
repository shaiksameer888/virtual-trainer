interface RepCounterProps {
  reps: number;
  validReps: number;
  partialReps: number;
  holdSeconds?: number;
}

export function RepCounter({ reps, validReps, partialReps, holdSeconds }: RepCounterProps) {
  return (
    <section className="rep-counter">
      <span>{holdSeconds !== undefined ? 'Hold' : 'Reps'}</span>
      <strong>{holdSeconds !== undefined ? `${Math.floor(holdSeconds)}s` : reps}</strong>
      <div>
        <p>
          <b>{validReps}</b> valid
        </p>
        <p>
          <b>{partialReps}</b> partial
        </p>
      </div>
    </section>
  );
}
