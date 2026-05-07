import { Clock, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

export const STATUS_CONFIG = {
  'To Do': { 
    color: 'bg-gray-500', 
    light: 'bg-gray-50', 
    text: 'text-gray-800', 
    border: 'border-gray-200', 
    cardBg: 'bg-gray-100',
    icon: Clock 
  },
  'In Progress': { 
    color: 'bg-blue-500', 
    light: 'bg-blue-50', 
    text: 'text-blue-800', 
    border: 'border-blue-200', 
    cardBg: 'bg-blue-100',
    icon: TrendingUp 
  },
  'Blocked': { 
    color: 'bg-red-500', 
    light: 'bg-red-50', 
    text: 'text-red-800', 
    border: 'border-red-200', 
    cardBg: 'bg-red-100',
    icon: AlertCircle 
  },
  'Done': { 
    color: 'bg-green-500', 
    light: 'bg-green-50', 
    text: 'text-green-800', 
    border: 'border-green-200', 
    cardBg: 'bg-green-100',
    icon: CheckCircle2 
  },
} as const;

export type StatusType = keyof typeof STATUS_CONFIG;
