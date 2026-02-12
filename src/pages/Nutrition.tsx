import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, UtensilsCrossed, Coffee, Sun, Moon, Cookie, ChevronLeft, ChevronRight, Trash2, Edit2, Flame, Sparkles, Loader2 } from 'lucide-react';
import { format, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Meal, MealType, FoodItem } from '@/types';
import { getMeals, saveMeal, deleteMeal, generateId, getProfile, calculateDailyTargets } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const mealTypeConfig: Record<MealType, { label: string; icon: any; color: string }> = {
  breakfast: { label: 'Desayuno', icon: Coffee, color: 'text-primary' },
  lunch: { label: 'Almuerzo', icon: Sun, color: 'text-secondary' },
  dinner: { label: 'Cena', icon: Moon, color: 'text-accent' },
  snack: { label: 'Snack', icon: Cookie, color: 'text-profile' },
};

export default function Nutrition() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);

  useEffect(() => {
    setMeals(getMeals());
  }, []);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayMeals = meals.filter(m => m.date === dateStr);

  const profile = getProfile();
  const targets = profile ? calculateDailyTargets(profile) : { calories: 2000, protein: 150, carbs: 225, fat: 67 };

  const totals = dayMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.totalCalories,
      protein: acc.protein + m.totalProtein,
      carbs: acc.carbs + m.totalCarbs,
      fat: acc.fat + m.totalFat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const handleSave = (meal: Meal) => {
    saveMeal(meal);
    setMeals(getMeals());
    setShowForm(false);
    setEditingMeal(null);
    toast.success(editingMeal ? 'Comida actualizada' : 'Comida registrada');
  };

  const handleDelete = (id: string) => {
    deleteMeal(id);
    setMeals(getMeals());
    toast.success('Comida eliminada');
  };

  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-nutrition flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">Alimentación</h1>
          </div>
          <Button
            onClick={() => { setEditingMeal(null); setShowForm(true); }}
            size="icon"
            className="gradient-nutrition rounded-xl text-primary-foreground"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between glass-card p-3 mb-4">
          <button onClick={() => setSelectedDate(addDays(selectedDate, -1))}>
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <span className="text-sm font-medium capitalize">
            {isSameDay(selectedDate, new Date()) ? 'Hoy' : format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
          </span>
          <button onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Daily Summary */}
        <div className="glass-card p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Resumen del día</span>
            </div>
            <span className="stat-number text-lg text-primary">{totals.calories}<span className="text-xs text-muted-foreground font-normal"> / {targets.calories} kcal</span></span>
          </div>
          <Progress value={Math.min((totals.calories / targets.calories) * 100, 100)} className="h-2 mb-3" />
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Proteínas', value: totals.protein, target: targets.protein, color: 'bg-secondary' },
              { label: 'Carbos', value: totals.carbs, target: targets.carbs, color: 'bg-accent' },
              { label: 'Grasas', value: totals.fat, target: targets.fat, color: 'bg-profile' },
            ].map(m => (
              <div key={m.label} className="text-center">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="text-sm font-bold">{m.value}g <span className="text-xs text-muted-foreground font-normal">/ {m.target}g</span></p>
                <div className="w-full h-1.5 bg-muted rounded-full mt-1">
                  <div className={`h-full rounded-full ${m.color}`} style={{ width: `${Math.min((m.value / m.target) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Meals by type */}
        {mealTypes.map(type => {
          const { label, icon: Icon, color } = mealTypeConfig[type];
          const typeMeals = dayMeals.filter(m => m.mealType === type);
          return (
            <div key={type} className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-sm font-semibold">{label}</span>
                </div>
                <button
                  onClick={() => { setEditingMeal(null); setShowForm(true); }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <AnimatePresence>
                {typeMeals.length === 0 ? (
                  <div className="glass-card p-3 text-center">
                    <p className="text-xs text-muted-foreground">Sin registro</p>
                  </div>
                ) : (
                  typeMeals.map(meal => (
                    <motion.div
                      key={meal.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="glass-card p-3 mb-1.5"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {meal.foods.map((f, i) => (
                            <p key={i} className="text-sm">{f.name} <span className="text-xs text-muted-foreground">{f.calories} kcal</span></p>
                          ))}
                          <p className="text-xs text-muted-foreground mt-1">
                            Total: {meal.totalCalories} kcal · P:{meal.totalProtein}g · C:{meal.totalCarbs}g · G:{meal.totalFat}g
                          </p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button onClick={() => { setEditingMeal(meal); setShowForm(true); }} className="p-1 rounded hover:bg-muted">
                            <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button onClick={() => handleDelete(meal.id)} className="p-1 rounded hover:bg-muted">
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </motion.div>

      <MealFormDialog
        open={showForm}
        onClose={() => { setShowForm(false); setEditingMeal(null); }}
        onSave={handleSave}
        date={dateStr}
        editing={editingMeal}
      />
    </div>
  );
}

function MealFormDialog({
  open, onClose, onSave, date, editing,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (m: Meal) => void;
  date: string;
  editing: Meal | null;
}) {
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [time, setTime] = useState('12:00');
  const [foods, setFoods] = useState<FoodItem[]>([{ name: '', calories: 0, protein: 0, carbs: 0, fat: 0 }]);
  const [aiDescription, setAiDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (editing) {
      setMealType(editing.mealType);
      setTime(editing.time);
      setFoods(editing.foods.length > 0 ? editing.foods : [{ name: '', calories: 0, protein: 0, carbs: 0, fat: 0 }]);
    } else {
      setMealType('lunch');
      setTime('12:00');
      setFoods([{ name: '', calories: 0, protein: 0, carbs: 0, fat: 0 }]);
    }
    setAiDescription('');
  }, [editing, open]);

  const updateFood = (index: number, field: keyof FoodItem, value: any) => {
    setFoods(prev => prev.map((f, i) => i === index ? { ...f, [field]: value } : f));
  };

  const addFood = () => setFoods(prev => [...prev, { name: '', calories: 0, protein: 0, carbs: 0, fat: 0 }]);
  const removeFood = (index: number) => setFoods(prev => prev.filter((_, i) => i !== index));

  const analyzeWithAI = async () => {
    if (!aiDescription.trim()) {
      toast.error('Escribe qué has comido');
      return;
    }
    setIsAnalyzing(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-food`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ description: aiDescription }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Error al analizar');
      }

      const data = await resp.json();
      if (data.foods && Array.isArray(data.foods) && data.foods.length > 0) {
        setFoods(data.foods.map((f: any) => ({
          name: f.name || '',
          calories: Math.round(f.calories || 0),
          protein: Math.round(f.protein || 0),
          carbs: Math.round(f.carbs || 0),
          fat: Math.round(f.fat || 0),
        })));
        toast.success('¡Alimentos analizados! Puedes editar los valores.');
      } else {
        throw new Error('No se pudieron detectar alimentos');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error al analizar la comida');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = () => {
    const validFoods = foods.filter(f => f.name.trim());
    if (validFoods.length === 0) {
      toast.error('Añade al menos un alimento');
      return;
    }
    const totals = validFoods.reduce(
      (acc, f) => ({
        calories: acc.calories + f.calories,
        protein: acc.protein + f.protein,
        carbs: acc.carbs + f.carbs,
        fat: acc.fat + f.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    onSave({
      id: editing?.id || generateId(),
      date,
      time,
      mealType,
      foods: validFoods,
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFat: totals.fat,
    });
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-card border-border max-w-sm mx-auto max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar' : 'Registrar'} Comida</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo</Label>
              <Select value={mealType} onValueChange={v => setMealType(v as MealType)}>
                <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Desayuno</SelectItem>
                  <SelectItem value="lunch">Almuerzo</SelectItem>
                  <SelectItem value="dinner">Cena</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hora</Label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="bg-muted border-border" />
            </div>
          </div>

          {/* AI Analysis Section */}
          <div className="space-y-2 p-3 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-secondary" />
              <Label className="text-xs font-semibold">Describe lo que has comido</Label>
            </div>
            <Textarea
              value={aiDescription}
              onChange={e => setAiDescription(e.target.value)}
              placeholder="Ej: Dos huevos revueltos con tostadas, un café con leche y una naranja"
              className="bg-card border-border text-sm min-h-[60px] resize-none"
            />
            <Button
              onClick={analyzeWithAI}
              disabled={isAnalyzing || !aiDescription.trim()}
              variant="outline"
              className="w-full text-sm border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
            >
              {isAnalyzing ? (
                <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Analizando...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-1.5" /> Estimar con IA</>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Alimentos {foods.some(f => f.name) && <span className="text-muted-foreground">(puedes editar los valores)</span>}</Label>
            {foods.map((food, i) => (
              <div key={i} className="bg-muted rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Input
                    value={food.name}
                    onChange={e => updateFood(i, 'name', e.target.value)}
                    placeholder="Nombre del alimento"
                    className="bg-card border-border text-sm flex-1"
                  />
                  {foods.length > 1 && (
                    <button onClick={() => removeFood(i)} className="ml-2 p-1 hover:bg-card rounded">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: 'calories' as const, label: 'kcal' },
                    { key: 'protein' as const, label: 'P(g)' },
                    { key: 'carbs' as const, label: 'C(g)' },
                    { key: 'fat' as const, label: 'G(g)' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <Label className="text-[10px] text-muted-foreground">{label}</Label>
                      <Input
                        type="number"
                        value={food[key]}
                        onChange={e => updateFood(i, key, parseFloat(e.target.value) || 0)}
                        className="bg-card border-border text-xs h-8"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <Button variant="ghost" onClick={addFood} className="w-full text-sm text-muted-foreground">
              <Plus className="w-4 h-4 mr-1" /> Añadir alimento
            </Button>
          </div>

          <Button onClick={handleSubmit} className="w-full gradient-nutrition text-primary-foreground font-semibold rounded-xl">
            {editing ? 'Actualizar' : 'Guardar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
