// User Profile
export interface UserProfile {
  age: number;
  weight: number; // kg
  height: number; // cm
  sex: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose_fat' | 'gain_muscle' | 'maintain';
  onboardingComplete: boolean;
}

// Training
export type ExerciseType = 'gym' | 'running' | 'cycling' | 'yoga' | 'swimming' | 'hiking' | 'other';
export type Intensity = 'low' | 'medium' | 'high';

export interface Workout {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  exerciseType: ExerciseType;
  duration: number; // minutes
  intensity: Intensity;
  caloriesBurned: number;
  notes?: string;
  recurring?: boolean;
  recurringDays?: number[]; // 0-6, Sun-Sat
}

// Nutrition
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodItem {
  name: string;
  calories: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  quantity?: string;
}

export interface Meal {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  mealType: MealType;
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  notes?: string;
  imageUrl?: string;
}

// Calculated targets
export interface DailyTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
