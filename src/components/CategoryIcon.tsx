import {
  Briefcase,
  Building2,
  Car,
  CreditCard,
  Film,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  Laptop,
  MoreHorizontal,
  Plane,
  PlusCircle,
  ShieldCheck,
  ShoppingBag,
  ShoppingBasket,
  Smartphone,
  Sparkles,
  TrendingUp,
  Tv,
  Utensils,
  Wallet,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  ShoppingBasket,
  Car,
  ShoppingBag,
  Zap,
  Home,
  GraduationCap,
  Film,
  HeartPulse,
  Plane,
  Sparkles,
  Tv,
  MoreHorizontal,
  Briefcase,
  Laptop,
  Building2,
  TrendingUp,
  Gift,
  PlusCircle,
  Wallet,
  Landmark,
  Smartphone,
  CreditCard,
  ShieldCheck,
};

export const AVAILABLE_CATEGORY_ICONS = Object.keys(ICON_MAP);

export function CategoryIcon({
  name,
  className = 'w-4 h-4',
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICON_MAP[name] ?? MoreHorizontal;
  return <Icon className={className} aria-hidden="true" />;
}
