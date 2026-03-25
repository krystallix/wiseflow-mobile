import React from 'react';
import * as LucideIcons from 'lucide-react-native';

export type DynamicIconProps = {
  name?: string | null;
  size?: number;
  color?: string;
  className?: string;
  fallback?: keyof typeof LucideIcons;
};

export function DynamicIcon({ name, size = 20, color, className, fallback = 'HelpCircle' }: DynamicIconProps) {
  // Convert 'zap' -> 'Zap', 'air-vent' -> 'AirVent'
  let iconName = name 
    ? name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')
    : undefined;
  
  // Try to find the icon, otherwise use fallback
  let IconComponent = (LucideIcons as any)[iconName as string];
  
  if (!IconComponent) {
    IconComponent = (LucideIcons as any)[fallback] || (LucideIcons as any)['HelpCircle'];
  }

  if (!IconComponent) return null;

  return <IconComponent size={size} color={color} className={className} />;
}
