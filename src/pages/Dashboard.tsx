import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Flame, TrendingUp, TrendingDown, Minus,
  Dumbbell, UtensilsCrossed, ChevronLeft, ChevronRight, Activity,
  BarChart3, Calendar as CalendarIcon
} from 'lucide-react';
import {
  format, addDays, subDays, isSameDay, startOfMonth, endOfMonth,
  eachDayOfInterval, startOfWeek, endOfWeek, subWeeks, subMonths
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { getWorkouts, getMeals, getProfile, calculateDailyTargets } from '@/lib/storage';
import { isWorkoutOnDate } from '@/lib/recurrence';
import { Workout, Meal } from '@/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

type StatsPeriod = 'day' | 'week' | 'month';

// ─── Helper: get the date range for a period ───
function getPeriodDates(period: StatsPeriod, refDate: Date): Date[] {
  switch (period) {
    case 'day':
      return [refDate];
    case 'week': {
      const start = startOfWeek(refDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end: addDays(start, 6) });
    }
    case 'month': {
      const start = startOfMonth(refDate);
      const end = endOfMonth(refDate);
      return eachDayOfInterval({ start, end });
    }
  }
}

// ─── Helper: aggregate data for period ───
function aggregateForPeriod(
  dates: Date[],
  workouts: Workout[],
  meals: Meal[]
) {
  return dates.map(day => {
    const ds = format(day, 'yyyy-MM-dd');
    const dayWorkouts = workouts.filter(w => isWorkoutOnDate(w, day));
    const dayMeals = meals.filter(m => m.date === ds);

    const caloriesIn = dayMeals.reduce((s, m) => s + m.totalCalories, 0);
    const caloriesOut = dayWorkouts.reduce((s, w) => s + w.caloriesBurned, 0);
    const protein = dayMeals.reduce((s, m) => s + m.totalProtein, 0);
    const carbs = dayMeals.reduce((s, m) => s + m.totalCarbs, 0);
    const fat = dayMeals.reduce((s, m) => s + m.totalFat, 0);
    const workoutMinutes = dayWorkouts.reduce((s, w) => s + w.duration, 0);

    return {
      date: day,
      label: format(day, dates.length > 7 ? 'd' : 'EEE', { locale: es }),
      caloriesIn,
      caloriesOut,
      balance: caloriesIn - caloriesOut,
      protein,
      carbs,
      fat,
      workoutMinutes,
      workoutCount: dayWorkouts.length,
      workouts: dayWorkouts,
    };
  });
}

const COLORS = {
  protein: 'hsl(var(--chart-1, 220 70% 50%))',
  carbs: 'hsl(var(--chart-2, 160 60% 45%))',
  fat: 'hsl(var(--chart-3, 30 80% 55%))',
  caloriesIn: 'hsl(var(--chart-2, 160 60% 45%))',
  caloriesOut: 'hsl(var(--chart-1, 220 70% 50%))',
};

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b'];

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthDate, setMonthDate] = useState(new Date());
  const [activeSection, setActiveSection] = useState<'today' | 'stats'>('today');
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>('week');

  const workouts = getWorkouts();
  const meals = getMeals();
  const profile = getProfile();
  const targets = profile ? calculateDailyTargets(profile) : { calories: 2000, protein: 150, carbs: 225, fat: 67 };

  // ─── Today data ───
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayWorkouts = workouts.filter(w => isWorkoutOnDate(w, selectedDate));
  const dayMeals = meals.filter(m => m.date === dateStr);

  const caloriesIn = dayMeals.reduce((s, m) => s + m.totalCalories, 0);
  const caloriesOut = dayWorkouts.reduce((s, w) => s + w.caloriesBurned, 0);
  const balance = caloriesIn - caloriesOut;

  const macros = dayMeals.reduce(
    (acc, m) => ({ protein: acc.protein + m.totalProtein, carbs: acc.carbs + m.totalCarbs, fat: acc.fat + m.totalFat }),
    { protein: 0, carbs: 0, fat: 0 }
  );

  const timeline = [
    ...dayWorkouts.map(w => ({ type: 'workout' as const, time: w.time, data: w })),
    ...dayMeals.map(m => ({ type: 'meal' as const, time: m.time, data: m })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  // ─── Calendar ───
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  // ─── Streak ───
  let streak = 0;
  let checkDate = new Date();
  while (true) {
    const ds = format(checkDate, 'yyyy-MM-dd');
    const hasActivity = workouts.some(w => isWorkoutOnDate(w, checkDate)) || meals.some(m => m.date === ds);
    if (!hasActivity) break;
    streak++;
    checkDate = addDays(checkDate, -1);
  }

  // ─── Stats data ───
  const periodDates = useMemo(() => getPeriodDates(statsPeriod, new Date()), [statsPeriod]);
  const periodData = useMemo(() => aggregateForPeriod(periodDates, workouts, meals), [periodDates, workouts, meals]);

  const totalStats = useMemo(() => {
    const totals = periodData.reduce((acc, d) => ({
      caloriesIn: acc.caloriesIn + d.caloriesIn,
      caloriesOut: acc.caloriesOut + d.caloriesOut,
      protein: acc.protein + d.protein,
      carbs: acc.carbs + d.carbs,
      fat: acc.fat + d.fat,
      workoutMinutes: acc.workoutMinutes + d.workoutMinutes,
      workoutCount: acc.workoutCount + d.workoutCount,
    }), { caloriesIn: 0, caloriesOut: 0, protein: 0, carbs: 0, fat: 0, workoutMinutes: 0, workoutCount: 0 });

    // Exercise type breakdown
    const exerciseMap: Record<string, { minutes: number; calories: number }> = {};
    periodData.forEach(d => {
      d.workouts.forEach(w => {
        if (!exerciseMap[w.exerciseType]) exerciseMap[w.exerciseType] = { minutes: 0, calories: 0 };
        exerciseMap[w.exerciseType].minutes += w.duration;
        exerciseMap[w.exerciseType].calories += w.caloriesBurned;
      });
    });

    const exerciseBreakdown = Object.entries(exerciseMap).map(([type, data]) => ({
      type,
      label: exerciseLabels[type] || type,
      ...data,
    }));

    return { ...totals, exerciseBreakdown };
  }, [periodData]);

  const macroPieData = [
    { name: 'Proteínas', value: totalStats.protein, color: PIE_COLORS[0] },
    { name: 'Carbohidratos', value: totalStats.carbs, color: PIE_COLORS[1] },
    { name: 'Grasas', value: totalStats.fat, color: PIE_COLORS[2] },
  ].filter(d => d.value > 0);

  const avgCalories = periodDates.length ? Math.round(totalStats.caloriesIn / periodDates.length) : 0;

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

        {/* Section Toggle */}
        <div className="glass-card p-1 mb-4 flex gap-1">
          <button
            onClick={() => setActiveSection('today')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeSection === 'today'
                ? 'gradient-dashboard text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <CalendarIcon className="w-4 h-4" /> Hoy
          </button>
          <button
            onClick={() => setActiveSection('stats')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeSection === 'stats'
                ? 'gradient-dashboard text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <BarChart3 className="w-4 h-4" /> Estadísticas
          </button>
        </div>

        {/* ═══════════ SECTION: HOY ═══════════ */}
        {activeSection === 'today' && (
          <motion.div
            key="today"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
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
                  const hasWorkout = workouts.some(w => isWorkoutOnDate(w, day));
                  const hasMeal = meals.some(m => m.date === ds);
                  const isCurrentMonth = day.getMonth() === monthDate.getMonth();
                  const isSelected = isSameDay(day, selectedDate);
                  return (
                    <button
                      key={ds}
                      onClick={() => setSelectedDate(day)}
                      className={`text-xs py-1.5 rounded-lg transition-all relative ${!isCurrentMonth ? 'opacity-30' : ''
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
        )}

        {/* ═══════════ SECTION: ESTADÍSTICAS ═══════════ */}
        {activeSection === 'stats' && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Period Toggle */}
            <div className="glass-card p-1 mb-4 flex gap-1">
              {([
                { value: 'day', label: 'Día' },
                { value: 'week', label: 'Semana' },
                { value: 'month', label: 'Mes' },
              ] as { value: StatsPeriod; label: string }[]).map(p => (
                <button
                  key={p.value}
                  onClick={() => setStatsPeriod(p.value)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${statsPeriod === p.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="glass-card p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Calorías Ingeridas</p>
                <p className="text-xl font-bold text-secondary">{totalStats.caloriesIn.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">~{avgCalories} kcal/día</p>
              </div>
              <div className="glass-card p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Calorías Quemadas</p>
                <p className="text-xl font-bold text-primary">{totalStats.caloriesOut.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">{totalStats.workoutCount} entrenos</p>
              </div>
              <div className="glass-card p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tiempo Entrenado</p>
                <p className="text-xl font-bold">{totalStats.workoutMinutes} <span className="text-sm font-normal text-muted-foreground">min</span></p>
              </div>
              <div className="glass-card p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Balance Neto</p>
                <p className={`text-xl font-bold ${(totalStats.caloriesIn - totalStats.caloriesOut) > 0 ? 'text-secondary' : 'text-primary'}`}>
                  {totalStats.caloriesIn - totalStats.caloriesOut > 0 ? '+' : ''}{totalStats.caloriesIn - totalStats.caloriesOut}
                </p>
              </div>
            </div>

            {/* Calorie Trend Chart */}
            {periodData.length > 1 && (
              <div className="glass-card p-4 mb-4">
                <h2 className="text-sm font-semibold text-muted-foreground mb-3">Tendencia Calórica</h2>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={periodData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="caloriesIn"
                        name="Ingeridas"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#colorIn)"
                      />
                      <Area
                        type="monotone"
                        dataKey="caloriesOut"
                        name="Quemadas"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fill="url(#colorOut)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <div className="w-2.5 h-2.5 rounded-sm bg-[#10b981]" />
                    <span className="text-muted-foreground">Ingeridas</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <div className="w-2.5 h-2.5 rounded-sm bg-[#6366f1]" />
                    <span className="text-muted-foreground">Quemadas</span>
                  </div>
                </div>
              </div>
            )}

            {/* Macro Breakdown Pie Chart */}
            {macroPieData.length > 0 && (
              <div className="glass-card p-4 mb-4">
                <h2 className="text-sm font-semibold text-muted-foreground mb-3">Desglose de Macros</h2>
                <div className="h-48 flex items-center">
                  <div className="w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={macroPieData}
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={4}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {macroPieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [`${value}g`, '']}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-1/2 space-y-2.5">
                    {macroPieData.map((item, i) => {
                      const total = macroPieData.reduce((s, d) => s + d.value, 0);
                      const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium truncate">{item.name}</span>
                              <span className="text-muted-foreground ml-1">{pct}%</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">{item.value}g</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Workout Summary Bar Chart */}
            {totalStats.exerciseBreakdown.length > 0 && (
              <div className="glass-card p-4 mb-4">
                <h2 className="text-sm font-semibold text-muted-foreground mb-3">Resumen de Entrenos</h2>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={totalStats.exerciseBreakdown} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Bar dataKey="minutes" name="Minutos" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="calories" name="Calorías" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <div className="w-2.5 h-2.5 rounded-sm bg-[#6366f1]" />
                    <span className="text-muted-foreground">Minutos</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <div className="w-2.5 h-2.5 rounded-sm bg-[#a855f7]" />
                    <span className="text-muted-foreground">Calorías</span>
                  </div>
                </div>
              </div>
            )}

            {/* Empty state */}
            {totalStats.caloriesIn === 0 && totalStats.caloriesOut === 0 && (
              <div className="glass-card p-8 text-center">
                <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Sin datos para este periodo</p>
                <p className="text-xs text-muted-foreground mt-1">Añade comidas y entrenamientos para ver estadísticas</p>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// Exercise type labels (shared with Training page — could be extracted)
const exerciseLabels: Record<string, string> = {
  gym: 'Gimnasio',
  running: 'Correr',
  cycling: 'Bicicleta',
  yoga: 'Yoga',
  swimming: 'Natación',
  hiking: 'Senderismo',
  other: 'Otro',
};
