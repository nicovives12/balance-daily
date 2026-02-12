import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, UserPlus, Loader2, Dumbbell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn, signUp } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) {
            toast.error('Completa todos los campos');
            return;
        }
        setLoading(true);
        try {
            const { error } = isLogin
                ? await signIn(email, password)
                : await signUp(email, password);

            if (error) {
                toast.error(error);
            } else if (!isLogin) {
                toast.success('¡Cuenta creada! Iniciando sesión...');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-background">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-sm"
            >
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                        className="w-16 h-16 rounded-2xl gradient-training flex items-center justify-center mx-auto mb-4"
                    >
                        <Dumbbell className="w-8 h-8 text-primary-foreground" />
                    </motion.div>
                    <h1 className="text-2xl font-bold">Balance Daily</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {isLogin ? 'Inicia sesión para continuar' : 'Crea tu cuenta'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" /> Email
                        </Label>
                        <Input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                            className="bg-muted border-border"
                            autoComplete="email"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5" /> Contraseña
                        </Label>
                        <Input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder={isLogin ? '••••••••' : 'Mínimo 6 caracteres'}
                            className="bg-muted border-border"
                            autoComplete={isLogin ? 'current-password' : 'new-password'}
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full gradient-training text-primary-foreground font-semibold h-11 rounded-xl"
                    >
                        {loading ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {isLogin ? 'Iniciando...' : 'Creando...'}</>
                        ) : isLogin ? (
                            <><LogIn className="w-4 h-4 mr-2" /> Iniciar Sesión</>
                        ) : (
                            <><UserPlus className="w-4 h-4 mr-2" /> Crear Cuenta</>
                        )}
                    </Button>
                </form>

                {/* Toggle login/register */}
                <p className="text-center text-sm text-muted-foreground mt-4">
                    {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-primary font-semibold hover:underline"
                    >
                        {isLogin ? 'Regístrate' : 'Inicia sesión'}
                    </button>
                </p>
            </motion.div>
        </div>
    );
}
