import {
  Wrench,
  Package,
  Zap,
  Settings,
  BarChart3,
  Target,
  Megaphone,
  Palette,
  Code,
  Camera,
  FileCode,
  MessageSquare,
  ShoppingCart,
  Globe,
  Mail,
  Phone,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Wrench,
  Package,
  Zap,
  Settings,
  BarChart3,
  Target,
  Megaphone,
  Palette,
  Code,
  Camera,
  FileCode,
  MessageSquare,
  ShoppingCart,
  Globe,
  Mail,
  Phone,
};

export const SERVICE_CATEGORY_ICON_OPTIONS = [
  { value: 'Wrench', label: 'Wrench' },
  { value: 'Package', label: 'Package' },
  { value: 'Zap', label: 'Zap' },
  { value: 'Settings', label: 'Settings' },
  { value: 'BarChart3', label: 'Chart' },
  { value: 'Target', label: 'Target' },
  { value: 'Megaphone', label: 'Megaphone' },
  { value: 'Palette', label: 'Palette' },
  { value: 'Code', label: 'Code' },
  { value: 'Camera', label: 'Camera' },
  { value: 'FileCode', label: 'File Code' },
  { value: 'MessageSquare', label: 'Message' },
  { value: 'ShoppingCart', label: 'Shopping' },
  { value: 'Globe', label: 'Globe' },
  { value: 'Mail', label: 'Mail' },
  { value: 'Phone', label: 'Phone' },
];

export function getServiceCategoryIcon(iconName: string | null | undefined): LucideIcon | null {
  if (!iconName) return null;
  return iconMap[iconName] || null;
}
