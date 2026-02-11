import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronLeft, ChevronRight, Dumbbell, Bike, PersonStanding, Waves, Mountain, Zap, Trash2, Edit2 } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Workout, ExerciseType, Intensity } from '@/types';
import { getWorkouts, saveWorkout, deleteWorkout, getProfile, estimateCaloriesBurned, generateId } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const exerciseIcons: Record<ExerciseType, any> = {
  gym: Dumbbell,
  running: PersonStanding,
  cycling: Bike,
  yoga: PersonStanding,
  swimming: Waves,
  hiking: Mountain,
  other: Zap,
};

const exerciseLabels: Record<ExerciseType, string> = {
  gym: 'Gimnasio',
  running: 'Correr',
  cycling: 'Bicicleta',
  yoga: 'Yoga',
  swimming: 'Natación',
  hiking: 'Senderismo',
  other: 'Otro',
};

const exerciseColors: Record<ExerciseType, string> = {
  gym: 'gradient-training',
  running: 'bg-primary',
  cycling: 'bg-accent',
  yoga: 'bg-profile',
  swimming: 'bg-dashboard',
  hiking: 'bg-secondary',
  other: 'bg-muted-foreground',
};

const intensityLabels: Record<Intensity, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
};

export default function Training() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  useEffect(() => {
    setWorkouts(getWorkouts());
  }, []);

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayWorkouts = workouts.filter(w => w.date === selectedDateStr);

  const handleSave = (workout: Workout) => {
    saveWorkout(workout);
    setWorkouts(getWorkouts());
    setShowForm(false);
    setEditingWorkout(null);
    toast.success(editingWorkout ? 'Entrenamiento actualizado' : 'Entrenamiento añadido');
  };

  const handleDelete = (id: string) => {
    deleteWorkout(id);
    setWorkouts(getWorkouts());
    toast.success('Entrenamiento eliminado');
  };

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-training flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">Entrenamiento</h1>
          </div>
          <Button
            onClick={() => { setEditingWorkout(null); setShowForm(true); }}
            size="icon"
            className="gradient-training rounded-xl text-primary-foreground"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Week Navigation */}
        <div className="glass-card p-3 mb-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft className="w-5 h-5 text-muted-foreground" /></button>
            <span className="text-sm font-medium capitalize">{format(weekStart, 'MMMM yyyy', { locale: es })}</span>
            <button onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight className="w-5 h-5 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map(day => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const hasWorkout = workouts.some(w => w.date === dayStr);
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              return (
                <button
                  key={dayStr}
                  onClick={() => setSelectedDate(day)}
                  className={`flex flex-col items-center py-2 rounded-xl transition-all ${
                    isSelected ? 'gradient-training text-primary-foreground' : isToday ? 'bg-muted' : ''
                  }`}
                >
                  <span className="text-[10px] uppercase font-medium opacity-70">
                    {format(day, 'EEE', { locale: es }).slice(0, 2)}
                  </span>
                  <span className="text-sm font-bold">{format(day, 'd')}</span>
                  {hasWorkout && !isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Detail */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 capitalize">
            {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
          </h2>
          <AnimatePresence mode="popLayout">
            {dayWorkouts.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 text-center">
                <Dumbbell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Sin entrenamientos este día</p>
                <Button
                  variant="ghost"
                  className="mt-2 text-primary text-sm"
                  onClick={() => { setEditingWorkout(null); setShowForm(true); }}
                >
                  <Plus className="w-4 h-4 mr-1" /> Añadir
                </Button>
              </motion.div>
            ) : (
              dayWorkouts.map(w => {
                const Icon = exerciseIcons[w.exerciseType] || Zap;
                return (
                  <motion.div
                    key={w.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-card p-4 mb-2 flex items-center gap-3"
                  >
                    <div className={`w-10 h-10 rounded-xl ${exerciseColors[w.exerciseType]} flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{exerciseLabels[w.exerciseType]}</p>
                      <p className="text-xs text-muted-foreground">
                        {w.duration} min · {intensityLabels[w.intensity]} · {w.caloriesBurned} kcal
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingWorkout(w); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-muted">
                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDelete(w.id)} className="p-1.5 rounded-lg hover:bg-muted">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Workout Form Dialog */}
      <WorkoutFormDialog
        open={showForm}
        onClose={() => { setShowForm(false); setEditingWorkout(null); }}
        onSave={handleSave}
        date={selectedDateStr}
        editing={editingWorkout}
      />
    </div>
  );
}

function WorkoutFormDialog({
  open, onClose, onSave, date, editing,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (w: Workout) => void;
  date: string;
  editing: Workout | null;
}) {
  const [exerciseType, setExerciseType] = useState<ExerciseType>('gym');
  const [duration, setDuration] = useState(60);
  const [intensity, setIntensity] = useState<Intensity>('medium');
  const [time, setTime] = useState('09:00');
  const [notes, setNotes] = useState('');
  const [manualCalories, setManualCalories] = useState<number | null>(null);

  useEffect(() => {
    if (editing) {
      setExerciseType(editing.exerciseType);
      setDuration(editing.duration);
      setIntensity(editing.intensity);
      setTime(editing.time);
      setNotes(editing.notes || '');
      setManualCalories(editing.caloriesBurned);
    } else {
      setExerciseType('gym');
      setDuration(60);
      setIntensity('medium');
      setTime('09:00');
      setNotes('');
      setManualCalories(null);
    }
  }, [editing, open]);

  const profile = getProfile();
  const weight = profile?.weight || 70;
  const estimated = estimateCaloriesBurned(exerciseType, duration, intensity, weight);
  const calories = manualCalories ?? estimated;

  const handleSubmit = () => {
    onSave({
      id: editing?.id || generateId(),
      date,
      time,
      exerciseType,
      duration,
      intensity,
      caloriesBurned: calories,
      notes: notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-card border-border max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar' : 'Nuevo'} Entrenamiento</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo</Label>
            <Select value={exerciseType} onValueChange={v => setExerciseType(v as ExerciseType)}>
              <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(exerciseLabels) as ExerciseType[]).map(k => (
                  <SelectItem key={k} value={k}>{exerciseLabels[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Hora</Label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="bg-muted border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Duración (min)</Label>
              <Input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value) || 0)} className="bg-muted border-border" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Intensidad</Label>
            <Select value={intensity} onValueChange={v => setIntensity(v as Intensity)}>
              <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Calorías quemadas (est. {estimated})</Label>
            <Input
              type="number"
              value={calories}
              onChange={e => setManualCalories(parseInt(e.target.value) || 0)}
              className="bg-muted border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Notas</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcional" className="bg-muted border-border" />
          </div>
          <Button onClick={handleSubmit} className="w-full gradient-training text-primary-foreground font-semibold rounded-xl">
            {editing ? 'Actualizar' : 'Guardar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
