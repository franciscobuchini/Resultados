import { type ReactNode, type ElementType } from 'react';
import { User, Shield, Star } from 'lucide-react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  className?: string;
  icon?: ElementType;
}

export function Badge({ children, variant = 'default', className = '', icon: Icon }: BadgeProps) {
  const variants = {
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
    error: 'bg-red-500/10 border-red-500/20 text-red-500',
    info: 'bg-sky-500/10 border-sky-500/20 text-sky-500',
    default: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400',
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
