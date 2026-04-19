import type { FeedbackMessage } from '../types/exercise';

export function speakFeedback(feedback: FeedbackMessage, enabled: boolean): void {
  if (!enabled || !feedback.speak || !('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(feedback.message);
  utterance.rate = 1;
  utterance.pitch = feedback.kind === 'success' ? 1.08 : 0.96;
  window.speechSynthesis.speak(utterance);
}
