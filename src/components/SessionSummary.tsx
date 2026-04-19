import type { SessionStats } from '../types/exercise';

interface SessionSummaryProps {
  stats: SessionStats;
  open: boolean;
  onClose: () => void;
}

export function SessionSummary({ stats, open, onClose }: SessionSummaryProps) {
  if (!open) return null;

  const issues = Object.entries(stats.issueCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Session summary">
      <section className="summary-modal">
        <div className="panel-heading">
          <span>Set summary</span>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="summary-grid">
          <Stat label="Total reps" value={stats.totalReps} />
          <Stat label="Valid reps" value={stats.validReps} />
          <Stat label="Partial reps" value={stats.partialReps} />
          <Stat label="Avg tempo" value={stats.averageTempoSeconds ? `${stats.averageTempoSeconds.toFixed(1)}s` : 'n/a'} />
        </div>
        <h3>Detected issues</h3>
        {issues.length ? (
          <ul>
            {issues.slice(0, 5).map(([issue, count]) => (
              <li key={issue}>
                {issue.replace(/_/g, ' ')}: {count}
              </li>
            ))}
          </ul>
        ) : (
          <p>No repeated issues detected.</p>
        )}
        <h3>Tips</h3>
        <ul>
          {(stats.tips.length ? stats.tips : ['Keep the next set smooth and controlled.']).map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
