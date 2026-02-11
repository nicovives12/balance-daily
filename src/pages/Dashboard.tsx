import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Flame, TrendingUp, TrendingDown, Minus, Dumbbell, UtensilsCrossed, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { format, addDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { getWorkouts, getMeals, getProfile, calculateDailyTargets } from '@/lib/storage';
import { Progress } from '@/components/ui/progress';

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthDate, setMonthDate] = useState(new Date());

  const workouts = getWorkouts();
  const meals = getMeals();
  const profile = getProfile();
  const targets = profile ? calculateDailyTargets(profile) : { calories: 2000, protein: 150, carbs: 225, fat: 67 };

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayWorkouts = workouts.filter(w => w.date === dateStr);
  const dayMeals = meals.filter(m => m.date === dateStr);

  const caloriesIn = dayMeals.reduce((s, m) => s + m.totalCalories, 0);
  const caloriesOut = dayWorkouts.reduce((s, w) => s + w.caloriesBurned, 0);
  const balance = caloriesIn - caloriesOut;

  const macros = dayMeals.reduce(
    (acc, m) => ({ protein: acc.protein + m.totalProtein, carbs: acc.carbs + m.totalCarbs, fat: acc.fat + m.totalFat }),
    { protein: 0, carbs: 0, fat: 0 }
  );

  // Timeline: merge workouts and meals sorted by time
  const timeline = [
    ...dayWorkouts.map(w => ({ type: 'workout' as const, time: w.time, data: w })),
    ...dayMeals.map(m => ({ type: 'meal' as const, time: m.time, data: m })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  // Month calendar
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  // Streak
  let streak = 0;
  let checkDate = new Date();
  while (true) {
    const ds = format(checkDate, 'yyyy-MM-dd');
    const hasActivity = workouts.some(w => w.date === ds) || meals.some(m => m.date === ds);
    if (!hasActivity) break;
    streak++;
    checkDate = addDays(checkDate, -1);
  }

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl gradient-dashboard flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Dashboard</h1>
            <p className="text-xs text-muted-foreground capitalize">
              {isSameDay(selectedDate, new Date()) ? 'Hoy' : format(selectedDate, "EEEE d MMM", { locale: es })}
            </p>
          </div>
          {streak > 0 && (
            <div className="ml-auto glass-card px-3 py-1.5 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-primary">{streak}</span>
              <span className="text-[10px] text-muted-foreground">días</span>
            </div>
          )}
        </div>

        {/* Caloric Balance */}
        <div className="glass-card p-4 mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">Balance Calórico</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Ingeridas</p>
              <p className="stat-number text-lg text-secondary">{caloriesIn}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Quemadas</p>
              <p className="stat-number text-lg text-primary">{caloriesOut}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Balance</p>
              <div className="flex items-center justify-center gap-1">
                {balance > 0 ? <TrendingUp className="w-4 h-4 text-secondary" /> : balance < 0 ? <TrendingDown className="w-4 h-4 text-primary" /> : <Minus className="w-4 h-4 text-muted-foreground" />}
                <p className={`stat-number text-lg ${balance > 0 ? 'text-secondary' : balance < 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                  {Math.abs(balance)}
                </p>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-2">
            Objetivo: {targets.calories} kcal
          </p>
        </div>

        {/* Macro Progress */}
        <div className="glass-card p-4 mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">Macronutrientes</h2>
          {[
            { label: 'Proteínas', value: macros.protein, target: targets.protein, color: 'bg-secondary' },
            { label: 'Carbohidratos', value: macros.carbs, target: targets.carbs, color: 'bg-accent' },
            { label: 'Grasas', value: macros.fat, target: targets.fat, color: 'bg-profile' },
          ].map(m => (
            <div key={m.label} className="mb-2.5 last:mb-0">
              <div className="flex justify-between text-xs mb-1">
                <span>{m.label}</span>
                <span className="text-muted-foreground">{m.value}g / {m.target}g</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full">
                <div className={`h-full rounded-full ${m.color} transition-all`} style={{ width: `${Math.min((m.value / m.target) * 100, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="glass-card p-4 mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">Timeline del Día</h2>
          {timeline.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Sin actividad registrada</p>
          ) : (
            <div className="space-y-2">
              {timeline.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-10 shrink-0">{item.time}</span>
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.type === 'workout' ? 'bg-primary' : 'bg-secondary'}`} />
                  {item.type === 'workout' ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Dumbbell className="w-3.5 h-3.5 text-primary" />
                      <span>{(item.data as any).exerciseType} · {(item.data as any).duration}min · {(item.data as any).caloriesBurned}kcal</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-secondary" />
                      <span>{(item.data as any).totalCalories}kcal · {(item.data as any).foods?.map((f: any) => f.name).join(', ')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Month Calendar */}
        <div className="glass-card p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setMonthDate(addDays(startOfMonth(monthDate), -1))}><ChevronLeft className="w-5 h-5 text-muted-foreground" /></button>
            <span className="text-sm font-medium capitalize">{format(monthDate, 'MMMM yyyy', { locale: es })}</span>
            <button onClick={() => setMonthDate(addDays(endOfMonth(monthDate), 1))}><ChevronRight className="w-5 h-5 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
              <span key={d} className="text-[10px] text-muted-foreground font-medium py-1">{d}</span>
            ))}
            {calDays.map(day => {
              const ds = format(day, 'yyyy-MM-dd');
              const hasWorkout = workouts.some(w => w.date === ds);
              const hasMeal = meals.some(m => m.date === ds);
              const isCurrentMonth = day.getMonth() === monthDate.getMonth();
              const isSelected = isSameDay(day, selectedDate);
              return (
                <button
                  key={ds}
                  onClick={() => setSelectedDate(day)}
                  className={`text-xs py-1.5 rounded-lg transition-all relative ${
                    !isCurrentMonth ? 'opacity-30' : ''
                  } ${isSelected ? 'bg-accent text-accent-foreground font-bold' : isSameDay(day, new Date()) ? 'bg-muted font-semibold' : ''}`}
                >
                  {format(day, 'd')}
                  <div className="flex gap-0.5 justify-center mt-0.5">
                    {hasWorkout && <div className="w-1 h-1 rounded-full bg-primary" />}
                    {hasMeal && <div className="w-1 h-1 rounded-full bg-secondary" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
