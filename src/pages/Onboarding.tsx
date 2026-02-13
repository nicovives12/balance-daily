import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, User, Activity, Target } from 'lucide-react';
import { UserProfile } from '@/types';
import { saveProfile } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function Onboarding() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [age, setAge] = useState(25);
    const [sex, setSex] = useState<'male' | 'female'>('male');
    const [weight, setWeight] = useState(70);
    const [height, setHeight] = useState(170);
    const [activityLevel, setActivityLevel] = useState<UserProfile['activityLevel']>('moderate');
    const [goal, setGoal] = useState<UserProfile['goal']>('maintain');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        if (!user) return;
        if (!name.trim()) {
            toast.error('Por favor, introduce tu nombre');
            return;
        }

        setSaving(true);
        try {
            await saveProfile(user.id, {
                name: name.trim(),
                age,
                sex,
                weight,
                height,
                activityLevel,
                goal,
                onboardingComplete: true,
            });
            toast.success('¡Perfil creado! Bienvenido/a, ' + name.trim());
            navigate('/dashboard', { replace: true });
        } catch (err) {
            toast.error('Error al guardar el perfil');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md space-y-6"
            >
                {/* Welcome header */}
                <div className="text-center space-y-2">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="w-16 h-16 rounded-2xl gradient-training mx-auto flex items-center justify-center shadow-lg"
                    >
                        <Sparkles className="w-8 h-8 text-white" />
                    </motion.div>
                    <h1 className="text-2xl font-bold mt-4">¡Bienvenido/a!</h1>
                    <p className="text-sm text-muted-foreground">
                        Cuéntanos un poco sobre ti para personalizar tu experiencia
                    </p>
                </div>

                {/* Form */}
                <div className="space-y-4">
                    {/* Name */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-card p-4 space-y-3"
                    >
                        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <User className="w-4 h-4" /> Tu nombre
                        </h2>
                        <Input
                            placeholder="¿Cómo quieres que te llamemos?"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="bg-muted border-border text-base"
                            autoFocus
                        />
                    </motion.div>

                    {/* Personal data */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="glass-card p-4 space-y-3"
                    >
                        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Activity className="w-4 h-4" /> Datos personales
                        </h2>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Edad</Label>
                                <Input
                                    type="number"
                                    value={age}
                                    onChange={e => setAge(parseInt(e.target.value) || 0)}
                                    className="bg-muted border-border"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Sexo</Label>
                                <Select value={sex} onValueChange={v => setSex(v as 'male' | 'female')}>
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
                                    value={weight}
                                    onChange={e => setWeight(parseFloat(e.target.value) || 0)}
                                    className="bg-muted border-border"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Altura (cm)</Label>
                                <Input
                                    type="number"
                                    value={height}
                                    onChange={e => setHeight(parseInt(e.target.value) || 0)}
                                    className="bg-muted border-border"
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Activity & Goal */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="glass-card p-4 space-y-3"
                    >
                        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Target className="w-4 h-4" /> Objetivo
                        </h2>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Nivel de actividad</Label>
                            <Select value={activityLevel} onValueChange={v => setActivityLevel(v as UserProfile['activityLevel'])}>
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
                            <Label className="text-xs">¿Cuál es tu objetivo?</Label>
                            <Select value={goal} onValueChange={v => setGoal(v as UserProfile['goal'])}>
                                <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="lose_fat">Perder grasa</SelectItem>
                                    <SelectItem value="gain_muscle">Ganar músculo</SelectItem>
                                    <SelectItem value="maintain">Mantenimiento</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </motion.div>
                </div>

                {/* Submit */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <Button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="w-full gradient-training text-primary-foreground font-semibold h-12 rounded-xl text-base"
                    >
                        {saving ? 'Guardando...' : 'Empezar'}
                        {!saving && <ArrowRight className="w-5 h-5 ml-2" />}
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
}
