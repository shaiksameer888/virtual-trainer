import { exerciseList } from '../engine/exercises';
import type { ExerciseId } from '../types/exercise';

interface ExerciseSelectorProps {
  value: ExerciseId;
  onChange: (exercise: ExerciseId) => void;
}

export function ExerciseSelector({ value, onChange }: ExerciseSelectorProps) {
  return (
    <label className="field">
      <span>Exercise</span>
      <select value={value} onChange={(event) => onChange(event.target.value as ExerciseId)}>
        {exerciseList.map((exercise) => (
          <option key={exercise.id} value={exercise.id}>
            {exercise.label}
          </option>
        ))}
      </select>
    </label>
  );
}
