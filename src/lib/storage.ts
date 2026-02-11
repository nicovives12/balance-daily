import { UserProfile, Workout, Meal, DailyTargets } from '@/types';

const KEYS = {
  PROFILE: 'fittrack_profile',
  WORKOUTS: 'fittrack_workouts',
  MEALS: 'fittrack_meals',
} as const;

// Profile
export function getProfile(): UserProfile | null {
  const data = localStorage.getItem(KEYS.PROFILE);
  return data ? JSON.parse(data) : null;
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
}

// Workouts
export function getWorkouts(): Workout[] {
  const data = localStorage.getItem(KEYS.WORKOUTS);
  return data ? JSON.parse(data) : [];
}

export function saveWorkout(workout: Workout): void {
  const workouts = getWorkouts();
  const idx = workouts.findIndex(w => w.id === workout.id);
  if (idx >= 0) workouts[idx] = workout;
  else workouts.push(workout);
  localStorage.setItem(KEYS.WORKOUTS, JSON.stringify(workouts));
}

export function deleteWorkout(id: string): void {
  const workouts = getWorkouts().filter(w => w.id !== id);
  localStorage.setItem(KEYS.WORKOUTS, JSON.stringify(workouts));
}

export function getWorkoutsByDate(date: string): Workout[] {
  return getWorkouts().filter(w => w.date === date);
}

// Meals
export function getMeals(): Meal[] {
  const data = localStorage.getItem(KEYS.MEALS);
  return data ? JSON.parse(data) : [];
}

export function saveMeal(meal: Meal): void {
  const meals = getMeals();
  const idx = meals.findIndex(m => m.id === meal.id);
  if (idx >= 0) meals[idx] = meal;
  else meals.push(meal);
  localStorage.setItem(KEYS.MEALS, JSON.stringify(meals));
}

export function deleteMeal(id: string): void {
  const meals = getMeals().filter(m => m.id !== id);
  localStorage.setItem(KEYS.MEALS, JSON.stringify(meals));
}

export function getMealsByDate(date: string): Meal[] {
  return getMeals().filter(m => m.date === date);
}

// Calorie/macro calculations
export function calculateDailyTargets(profile: UserProfile): DailyTargets {
  // Mifflin-St Jeor
  let bmr: number;
  if (profile.sex === 'male') {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
  } else {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
  }

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  let tdee = bmr * (activityMultipliers[profile.activityLevel] || 1.55);

  // Adjust for goal
  if (profile.goal === 'lose_fat') tdee -= 400;
  else if (profile.goal === 'gain_muscle') tdee += 300;

  const calories = Math.round(tdee);

  // Macro distribution
  let proteinPct: number, carbsPct: number, fatPct: number;
  if (profile.goal === 'lose_fat') {
    proteinPct = 0.35; carbsPct = 0.35; fatPct = 0.30;
  } else if (profile.goal === 'gain_muscle') {
    proteinPct = 0.30; carbsPct = 0.45; fatPct = 0.25;
  } else {
    proteinPct = 0.25; carbsPct = 0.45; fatPct = 0.30;
  }

  return {
    calories,
    protein: Math.round((calories * proteinPct) / 4),
    carbs: Math.round((calories * carbsPct) / 4),
    fat: Math.round((calories * fatPct) / 9),
  };
}

// Estimate calories burned
export function estimateCaloriesBurned(
  exerciseType: string,
  duration: number,
  intensity: string,
  weight: number
): number {
  // MET values (approximate)
  const mets: Record<string, Record<string, number>> = {
    gym: { low: 3.5, medium: 5, high: 8 },
    running: { low: 7, medium: 9.8, high: 12.8 },
    cycling: { low: 4, medium: 6.8, high: 10 },
    yoga: { low: 2.5, medium: 3, high: 4 },
    swimming: { low: 4.5, medium: 7, high: 10 },
    hiking: { low: 3.5, medium: 5.3, high: 7.5 },
    other: { low: 3, medium: 5, high: 7 },
  };

  const met = mets[exerciseType]?.[intensity] || 5;
  return Math.round((met * weight * duration) / 60);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
