import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Target, Flame, Save, LogOut, Pencil, X } from 'lucide-react';
import { UserProfile } from '@/types';
import { getProfile, saveProfile, calculateDailyTargets } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const defaultProfile: UserProfile = {
  name: '',
  age: 25,
  weight: 70,
  height: 170,
  sex: 'male',
  activityLevel: 'moderate',
  goal: 'maintain',
  onboardingComplete: false,
};

const activityLabels: Record<string, string> = {
  sedentary: 'Sedentario',
  light: 'Actividad ligera',
  moderate: 'Moderado',
  active: 'Activo',
  very_active: 'Muy activo',
};

const goalLabels: Record<string, string> = {
  lose_fat: 'Perder grasa',
  gain_muscle: 'Ganar músculo',
  maintain: 'Mantenimiento',
};

export default function Profile() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [editing, setEditing] = useState(false);
  const [editProfile, setEditProfile] = useState<UserProfile>(defaultProfile);

  useEffect(() => {
    if (!user) return;
    getProfile(user.id).then(saved => {
      if (saved) {
        setProfile(saved);
        setEditProfile(saved);
      }
    });
  }, [user]);

  const targets = calculateDailyTargets(profile);

  const handleSave = async () => {
    if (!user) return;
    const updated = { ...editProfile, onboardingComplete: true };
    await saveProfile(user.id, updated);
    setProfile(updated);
    setEditing(false);
    toast.success('Perfil actualizado');
  };

  const handleCancel = () => {
    setEditProfile(profile);
    setEditing(false);
  };

  const startEditing = () => {
    setEditProfile(profile);
    setEditing(true);
  };

  const update = (field: keyof UserProfile, value: any) => {
    setEditProfile(prev => ({ ...prev, [field]: value }));
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
            <h1 className="text-xl font-bold">{profile.name || 'Mi Perfil'}</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Personal Data Card */}
          <div className="glass-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Datos Personales</h2>
              {!editing && (
                <button
                  onClick={startEditing}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </button>
              )}
            </div>

            {editing ? (
              /* ─── Edit Mode ─── */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <div className="space-y-1.5">
                  <Label className="text-xs">Nombre</Label>
                  <Input
                    value={editProfile.name}
                    onChange={e => update('name', e.target.value)}
                    className="bg-muted border-border"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Edad</Label>
                    <Input
                      type="number"
                      value={editProfile.age}
                      onChange={e => update('age', parseInt(e.target.value) || 0)}
                      className="bg-muted border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Sexo</Label>
                    <Select value={editProfile.sex} onValueChange={v => update('sex', v)}>
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
                      value={editProfile.weight}
                      onChange={e => update('weight', parseFloat(e.target.value) || 0)}
                      className="bg-muted border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Altura (cm)</Label>
                    <Input
                      type="number"
                      value={editProfile.height}
                      onChange={e => update('height', parseInt(e.target.value) || 0)}
                      className="bg-muted border-border"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Nivel de actividad</Label>
                  <Select value={editProfile.activityLevel} onValueChange={v => update('activityLevel', v)}>
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
                  <Select value={editProfile.goal} onValueChange={v => update('goal', v)}>
                    <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lose_fat">Perder grasa</SelectItem>
                      <SelectItem value="gain_muscle">Ganar músculo</SelectItem>
                      <SelectItem value="maintain">Mantenimiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} className="flex-1 gradient-training text-primary-foreground font-semibold rounded-xl">
                    <Save className="w-4 h-4 mr-2" /> Guardar
                  </Button>
                  <Button onClick={handleCancel} variant="outline" className="rounded-xl">
                    <X className="w-4 h-4 mr-1" /> Cancelar
                  </Button>
                </div>
              </motion.div>
            ) : (
              /* ─── Read-only Mode ─── */
              <div className="space-y-2">
                {profile.name && (
                  <div className="flex justify-between py-1.5 border-b border-border/50">
                    <span className="text-xs text-muted-foreground">Nombre</span>
                    <span className="text-sm font-medium">{profile.name}</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Edad</span>
                  <span className="text-sm font-medium">{profile.age} años</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Sexo</span>
                  <span className="text-sm font-medium">{profile.sex === 'male' ? 'Hombre' : 'Mujer'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Peso</span>
                  <span className="text-sm font-medium">{profile.weight} kg</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Altura</span>
                  <span className="text-sm font-medium">{profile.height} cm</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Actividad</span>
                  <span className="text-sm font-medium">{activityLabels[profile.activityLevel]}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-xs text-muted-foreground">Objetivo</span>
                  <span className="text-sm font-medium">{goalLabels[profile.goal]}</span>
                </div>
              </div>
            )}
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

          <Button
            onClick={signOut}
            variant="outline"
            className="w-full h-12 rounded-xl border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground font-semibold"
          >
            <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
