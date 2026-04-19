import { squatExercise } from './squat';
import {
  bicepCurlExercise,
  lungeExercise,
  plankExercise,
  pushupExercise,
  shoulderPressExercise
} from './genericExercises';
import type { ExerciseDefinition, ExerciseId } from '../../types/exercise';

export const exercises: Record<ExerciseId, ExerciseDefinition> = {
  squat: squatExercise,
  pushup: pushupExercise,
  shoulder_press: shoulderPressExercise,
  bicep_curl: bicepCurlExercise,
  lunge: lungeExercise,
  plank: plankExercise
};

export const exerciseList = Object.values(exercises);
