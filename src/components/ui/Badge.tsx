import { type ReactNode, type ElementType } from 'react';
import { User, Shield, Star } from 'lucide-react';
import { useThemeClasses } from '../../functions/themeStore';

interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  className?: string;
  icon?: ElementType;
}

export function Badge({ children, variant = 'default', className = '', icon: Icon }: BadgeProps) {
  const { textSuccess, textError, textInfo, textAlert, textMuted } = useThemeClasses();

  const variants = {
    success: `${textSuccess || 'text-green-500'} bg-current/10 border-current/20`,
    warning: `${textAlert || 'text-amber-500'} bg-current/10 border-current/20`,
    error: `${textError || 'text-red-500'} bg-current/10 border-current/20`,
    info: `${textInfo || 'text-blue-500'} bg-current/10 border-current/20`,
    default: `${textMuted || 'text-zinc-500'} bg-current/10 border-current/20`,
  };

  return (
    <div className={`px-3 py-2 rounded-full border text-xs capitalize inline-flex items-center justify-center gap-2 ${variants[variant]} ${className}`}>
      {Icon && <Icon size={14} />}
      {children}
    </div>
  );
}

export function PlanBadge({ plan }: { plan: string }) {
  const p = plan.toLowerCase();

  if (p === 'admin') return <Badge variant="info" icon={Shield}>Administrador</Badge>;
  if (p === 'pro') return <Badge variant="success" icon={Star}>Profesional</Badge>;
  return <Badge variant="default" icon={User}>Usuario</Badge>;
}
