import type { FeedbackMessage } from '../types/exercise';

const kindRank: Record<FeedbackMessage['kind'], number> = {
  warning: 0,
  cue: 1,
  success: 2
};

export function selectTopFeedback(feedback: FeedbackMessage[], limit = 2): FeedbackMessage[] {
  const seen = new Set<string>();
  return feedback
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .sort((a, b) => a.priority - b.priority || kindRank[a.kind] - kindRank[b.kind])
    .slice(0, limit);
}

export function feedback(id: string, message: string, kind: FeedbackMessage['kind'], priority: number, speak = false): FeedbackMessage {
  return { id, message, kind, priority, speak };
}
