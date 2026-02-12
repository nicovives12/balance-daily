import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Target, Flame, Save } from 'lucide-react';
import { UserProfile } from '@/types';
import { getProfile, saveProfile, calculateDailyTargets } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const defaultProfile: UserProfile = {
  age: 25,
  weight: 70,
  height: 170,
  sex: 'male',
  activityLevel: 'moderate',
  goal: 'maintain',
  onboardingComplete: false,
};

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);

  useEffect(() => {
    const saved = getProfile();
    if (saved) setProfile(saved);
  }, []);

  const targets = calculateDailyTargets(profile);

  const handleSave = () => {
    saveProfile({ ...profile, onboardingComplete: true });
    toast.success('Perfil guardado correctamente');
  };

  const update = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl gradient-profile flex items-center justify-center">
            <User className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Mi Perfil</h1>
            <p className="text-sm text-muted-foreground">Configura tus datos personales</p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="glass-card p-4 space-y-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Datos Personales</h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Edad</Label>
                <Input
                  type="number"
                  value={profile.age}
                  onChange={e => update('age', parseInt(e.target.value) || 0)}
                  className="bg-muted border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Sexo</Label>
                <Select value={profile.sex} onValueChange={v => update('sex', v)}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Hombre</SelectItem>
                    <SelectItem value="female">Mujer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Peso (kg)</Label>
                <Input
                  type="number"
                  value={profile.weight}
                  onChange={e => update('weight', parseFloat(e.target.value) || 0)}
                  className="bg-muted border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Altura (cm)</Label>
                <Input
                  type="number"
                  value={profile.height}
                  onChange={e => update('height', parseInt(e.target.value) || 0)}
                  className="bg-muted border-border"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Nivel de actividad</Label>
              <Select value={profile.activityLevel} onValueChange={v => update('activityLevel', v)}>
                <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentario</SelectItem>
                  <SelectItem value="light">Actividad ligera</SelectItem>
                  <SelectItem value="moderate">Moderado</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="very_active">Muy activo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Objetivo</Label>
              <Select value={profile.goal} onValueChange={v => update('goal', v)}>
                <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lose_fat">Perder grasa</SelectItem>
                  <SelectItem value="gain_muscle">Ganar músculo</SelectItem>
                  <SelectItem value="maintain">Mantenimiento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Daily Targets Preview */}
          <div className="glass-card p-4 space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4" /> Objetivos Diarios
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted rounded-xl p-3 text-center flex flex-col items-center justify-center">
                <Flame className="w-5 h-5 text-primary mb-1" />
                <p className="stat-number text-primary">{targets.calories}</p>
                <p className="text-[10px] text-muted-foreground">kcal</p>
              </div>
              <div className="bg-muted rounded-xl p-3 text-center flex flex-col items-center justify-center">
                <p className="stat-number text-secondary">{targets.protein}g</p>
                <p className="text-[10px] text-muted-foreground">Proteínas</p>
              </div>
              <div className="bg-muted rounded-xl p-3 text-center flex flex-col items-center justify-center">
                <p className="stat-number text-accent">{targets.carbs}g</p>
                <p className="text-[10px] text-muted-foreground">Carbohidratos</p>
              </div>
              <div className="bg-muted rounded-xl p-3 text-center flex flex-col items-center justify-center">
                <p className="stat-number text-profile">{targets.fat}g</p>
                <p className="text-[10px] text-muted-foreground">Grasas</p>
              </div>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full gradient-training text-primary-foreground font-semibold h-12 rounded-xl">
            <Save className="w-4 h-4 mr-2" /> Guardar Perfil
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
