import { UserProfile, Workout, Meal, DailyTargets } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// ─── Profile ───

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.warn('[getProfile]', error.message);
    return null;
  }

  return {
    age: data.age ?? 25,
    weight: data.weight ?? 70,
    height: data.height ?? 170,
    sex: (data.sex as any) ?? 'male',
    activityLevel: (data.activity_level as any) ?? 'moderate',
    goal: (data.goal as any) ?? 'maintain',
    onboardingComplete: data.onboarding_complete ?? false,
  };
}

export async function saveProfile(userId: string, profile: UserProfile): Promise<void> {
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    age: profile.age,
    weight: profile.weight,
    height: profile.height,
    sex: profile.sex,
    activity_level: profile.activityLevel,
    goal: profile.goal,
    onboarding_complete: profile.onboardingComplete,
  });
  if (error) {
    console.error('[saveProfile]', error);
    throw new Error(error.message);
  }
}

// ─── Workouts ───

export async function getWorkouts(userId: string): Promise<Workout[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('[getWorkouts]', error);
    return [];
  }

  return (data ?? []).map((w: any) => ({
    id: w.id,
    date: w.date,
    time: w.time ?? '',
    exerciseType: w.exercise_type ?? 'other',
    duration: w.duration ?? 0,
    intensity: w.intensity ?? 'medium',
    caloriesBurned: w.calories_burned ?? 0,
    notes: w.notes ?? '',
    recurring: w.recurring ?? false,
    recurrenceType: w.recurrence_type,
    recurrenceInterval: w.recurrence_interval,
    recurrenceDays: w.recurrence_days,
    recurrenceEnd: w.recurrence_end,
  }));
}

export async function saveWorkout(userId: string, workout: Workout): Promise<void> {
  const payload = {
    id: workout.id,
    user_id: userId,
    date: workout.date,
    time: workout.time,
    exercise_type: workout.exerciseType,
    duration: workout.duration,
    intensity: workout.intensity,
    calories_burned: workout.caloriesBurned,
    notes: workout.notes,
    recurring: workout.recurring ?? false,
    recurrence_type: workout.recurrenceType ?? null,
    recurrence_interval: workout.recurrenceInterval ?? null,
    recurrence_days: workout.recurrenceDays ?? null,
    recurrence_end: workout.recurrenceEnd ?? null,
  };

  const { error } = await supabase.from('workouts').upsert(payload);
  if (error) {
    console.error('[saveWorkout] ERROR:', error);
    throw new Error(error.message);
  }

}

export async function deleteWorkout(id: string): Promise<void> {
  const { error } = await supabase.from('workouts').delete().eq('id', id);
  if (error) {
    console.error('[deleteWorkout]', error);
    throw new Error(error.message);
  }
}

// ─── Meals ───

export async function getMeals(userId: string): Promise<Meal[]> {
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('[getMeals]', error);
    return [];
  }

  return (data ?? []).map((m: any) => ({
    id: m.id,
    date: m.date,
    time: m.time ?? '',
    mealType: m.meal_type ?? 'lunch',
    foods: (m.foods as any) ?? [],
    totalCalories: m.total_calories ?? 0,
    totalProtein: m.total_protein ?? 0,
    totalCarbs: m.total_carbs ?? 0,
    totalFat: m.total_fat ?? 0,
    notes: m.notes,
    imageUrl: m.image_url,
  }));
}

export async function saveMeal(userId: string, meal: Meal): Promise<void> {
  const payload = {
    id: meal.id,
    user_id: userId,
    date: meal.date,
    time: meal.time,
    meal_type: meal.mealType,
    foods: meal.foods as any,
    total_calories: meal.totalCalories,
    total_protein: meal.totalProtein,
    total_carbs: meal.totalCarbs,
    total_fat: meal.totalFat,
    notes: meal.notes ?? null,
    image_url: meal.imageUrl ?? null,
  };

  const { error } = await supabase.from('meals').upsert(payload);
  if (error) {
    console.error('[saveMeal] ERROR:', error);
    throw new Error(error.message);
  }

}

export async function deleteMeal(id: string): Promise<void> {
  const { error } = await supabase.from('meals').delete().eq('id', id);
  if (error) {
    console.error('[deleteMeal]', error);
    throw new Error(error.message);
  }
}

// ─── Pure calculations (no DB needed) ───

export function calculateDailyTargets(profile: UserProfile): DailyTargets {
  let bmr: number;
  if (profile.sex === 'male') {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
  } else {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
  }

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
  };

  let tdee = bmr * (activityMultipliers[profile.activityLevel] || 1.55);

  if (profile.goal === 'lose_fat') tdee -= 400;
  else if (profile.goal === 'gain_muscle') tdee += 300;

  const calories = Math.round(tdee);

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

export function estimateCaloriesBurned(
  exerciseType: string, duration: number, intensity: string, weight: number
): number {
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
  return crypto.randomUUID();
}
