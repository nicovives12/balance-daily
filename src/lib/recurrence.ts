import { format, parseISO } from 'date-fns';
import { Workout } from '@/types';

/**
 * Check if a workout should appear on a given target date,
 * considering both exact date matches and recurrence rules.
 */
export function isWorkoutOnDate(workout: Workout, targetDate: Date): boolean {
    const targetDateStr = format(targetDate, 'yyyy-MM-dd');

    // 1. Exact date match
    if (workout.date === targetDateStr) return true;

    // 2. Recurrence match — only if workout started on or before targetDate
    if (workout.recurring && workout.recurrenceType && workout.recurrenceType !== 'none' && workout.date <= targetDateStr) {
        // Check end date
        if (workout.recurrenceEnd && targetDateStr > workout.recurrenceEnd) return false;

        switch (workout.recurrenceType) {
            case 'daily':
                return true;

            case 'weekly':
                // getDay(): 0 = Sunday, 1 = Monday ... 6 = Saturday
                return workout.recurrenceDays?.includes(targetDate.getDay()) ?? false;

            case 'custom': {
                if (!workout.recurrenceInterval || workout.recurrenceInterval < 1) return false;

                // Normalise times to midnight for accurate day difference
                const start = parseISO(workout.date);
                start.setHours(0, 0, 0, 0);
                const target = new Date(targetDate);
                target.setHours(0, 0, 0, 0);

                const diffMs = target.getTime() - start.getTime();
                const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
                return diffDays >= 0 && diffDays % workout.recurrenceInterval === 0;
            }

            default:
                return false;
        }
    }

    return false;
}
