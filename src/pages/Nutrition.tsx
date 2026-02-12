import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, UtensilsCrossed, Coffee, Sun, Moon, Cookie,
  ChevronLeft, ChevronRight, Trash2, Edit2, Flame,
  Sparkles, Loader2, Mic, MicOff, Camera, Image as ImageIcon
} from 'lucide-react';
import { format, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Meal, MealType, FoodItem } from '@/types';
import { getMeals, saveMeal, deleteMeal, generateId, getProfile, calculateDailyTargets } from '@/lib/storage';
import { analyzeTextWithGemini, analyzeImageWithGemini, fileToBase64 } from '@/lib/gemini';
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

  // AI states
  const [aiDescription, setAiDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'text' | 'voice' | 'image'>('text');

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

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
    setImagePreview(null);
    setIsListening(false);
  }, [editing, open]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const updateFood = (index: number, field: keyof FoodItem, value: any) => {
    setFoods(prev => prev.map((f, i) => i === index ? { ...f, [field]: value } : f));
  };

  const addFood = () => setFoods(prev => [...prev, { name: '', calories: 0, protein: 0, carbs: 0, fat: 0 }]);
  const removeFood = (index: number) => setFoods(prev => prev.filter((_, i) => i !== index));

  // ─── Voice Input (Web Speech API) ───
  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = aiDescription;

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? ' ' : '') + t;
        } else {
          interim += t;
        }
      }
      setAiDescription(finalTranscript + (interim ? ' ' + interim : ''));
    };

    recognition.onerror = (event: any) => {
      console.error('Speech error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        toast.error('Permiso de micrófono denegado. Actívalo en la configuración del navegador.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setInputMode('voice');
    toast.success('🎤 Escuchando... Describe lo que has comido');
  };

  // ─── Image Input ───
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecciona una imagen');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen es demasiado grande (máx. 10MB)');
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    // Analyze with Gemini Vision
    setIsAnalyzing(true);
    setInputMode('image');
    try {
      const base64 = await fileToBase64(file);
      const result = await analyzeImageWithGemini(base64, file.type);

      setFoods(result.foods);
      if (result.mealType) setMealType(result.mealType);
      toast.success('📸 ¡Imagen analizada! Revisa los datos antes de guardar.');
    } catch (err: any) {
      toast.error(err.message || 'Error al analizar la imagen');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ─── Text Analysis with Gemini ───
  const analyzeWithAI = async () => {
    if (!aiDescription.trim()) {
      toast.error('Escribe o dicta qué has comido');
      return;
    }

    // Stop voice if active
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeTextWithGemini(aiDescription);

      setFoods(result.foods);
      if (result.mealType) setMealType(result.mealType);
      toast.success('✨ ¡Analizado! Revisa y edita los valores antes de guardar.');
    } catch (err: any) {
      toast.error(err.message || 'Error al analizar la comida');
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
      <DialogContent className="bg-card border-border max-w-sm mx-auto max-h-[85vh] overflow-y-auto">
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

          {/* ═══════ AI Input Section ═══════ */}
          <div className="space-y-2.5 p-3 rounded-xl bg-gradient-to-br from-secondary/5 to-accent/5 border border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-secondary" />
              <Label className="text-xs font-semibold">Asistente IA</Label>
            </div>

            {/* Input mode buttons */}
            <div className="flex gap-1.5">
              <button
                onClick={() => setInputMode('text')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1 ${inputMode === 'text' ? 'bg-secondary text-secondary-foreground' : 'bg-muted hover:bg-muted/80'
                  }`}
              >
                <Sparkles className="w-3 h-3" /> Texto
              </button>
              <button
                onClick={() => { setInputMode('voice'); toggleVoice(); }}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1 ${inputMode === 'voice' || isListening ? 'bg-secondary text-secondary-foreground' : 'bg-muted hover:bg-muted/80'
                  }`}
              >
                {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                {isListening ? 'Parar' : 'Voz'}
              </button>
              <button
                onClick={() => { setInputMode('image'); fileInputRef.current?.click(); }}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1 ${inputMode === 'image' ? 'bg-secondary text-secondary-foreground' : 'bg-muted hover:bg-muted/80'
                  }`}
              >
                <Camera className="w-3 h-3" /> Foto
              </button>
            </div>

            {/* Hidden file input for images */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageSelect}
            />

            {/* Image preview */}
            {imagePreview && (
              <div className="relative rounded-lg overflow-hidden">
                <img src={imagePreview} alt="Food preview" className="w-full h-32 object-cover rounded-lg" />
                <button
                  onClick={() => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="absolute top-1.5 right-1.5 bg-black/50 text-white rounded-full p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Text/Voice input */}
            {(inputMode === 'text' || inputMode === 'voice') && (
              <>
                <Textarea
                  value={aiDescription}
                  onChange={e => setAiDescription(e.target.value)}
                  placeholder={isListening
                    ? '🎤 Escuchando... habla ahora'
                    : 'Ej: "He desayunado tostadas con aguacate, dos huevos revueltos y un zumo de naranja"'
                  }
                  className={`bg-card border-border text-sm min-h-[60px] resize-none transition-all ${isListening ? 'border-secondary ring-2 ring-secondary/30' : ''
                    }`}
                />

                {/* Voice indicator */}
                {isListening && (
                  <div className="flex items-center justify-center gap-2 py-1">
                    <div className="flex gap-0.5">
                      {[0, 1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className="w-1 bg-secondary rounded-full animate-pulse"
                          style={{
                            height: `${8 + Math.random() * 12}px`,
                            animationDelay: `${i * 0.15}s`,
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-secondary font-medium">Grabando...</span>
                  </div>
                )}

                <Button
                  onClick={analyzeWithAI}
                  disabled={isAnalyzing || !aiDescription.trim()}
                  variant="outline"
                  className="w-full text-sm border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
                >
                  {isAnalyzing ? (
                    <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Analizando...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-1.5" /> Analizar con IA</>
                  )}
                </Button>
              </>
            )}

            {/* Loading overlay for image analysis */}
            {isAnalyzing && inputMode === 'image' && (
              <div className="flex items-center justify-center gap-2 py-3">
                <Loader2 className="w-5 h-5 animate-spin text-secondary" />
                <span className="text-xs text-muted-foreground">Analizando imagen...</span>
              </div>
            )}
          </div>

          {/* ═══════ Food Items (editable) ═══════ */}
          <div className="space-y-2">
            <Label className="text-xs">Alimentos {foods.some(f => f.name) && <span className="text-muted-foreground">(revisa y edita los valores)</span>}</Label>
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
