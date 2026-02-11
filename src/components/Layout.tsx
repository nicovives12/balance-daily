import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Dumbbell, UtensilsCrossed, LayoutDashboard, User } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/training', icon: Dumbbell, label: 'Entreno', color: 'text-training' },
  { path: '/nutrition', icon: UtensilsCrossed, label: 'Comida', color: 'text-nutrition' },
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'text-dashboard' },
  { path: '/profile', icon: User, label: 'Perfil', color: 'text-profile' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 pb-20 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card rounded-none border-t border-border/30 px-2 py-1 safe-area-bottom">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {navItems.map(({ path, icon: Icon, label, color }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="flex flex-col items-center gap-0.5 py-2 px-3 relative"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -top-1 w-8 h-1 rounded-full gradient-training"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 transition-colors ${isActive ? color : 'text-muted-foreground'}`}
                />
                <span
                  className={`text-[10px] font-medium transition-colors ${isActive ? color : 'text-muted-foreground'}`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
