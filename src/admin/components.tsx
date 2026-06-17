// src/admin/components.tsx
// ============================================
// Composants UI pour l'administration (Next.js)
// ============================================

'use client';

import React from 'react';
import Link from 'next/link';
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  X,
  LogOut,
  FileText,
  AlertTriangle,
  Tag,
  CheckSquare,
  Search,
  Loader2
} from 'lucide-react';
import type { AdminScreen, NavItem, OrderStatus } from './types';

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Dashboard', icon: 'home' },
  { id: 'products', label: 'Produits', icon: 'package' },
  { id: 'orders', label: 'Commandes', icon: 'cart' },
  { id: 'customers', label: 'Clients', icon: 'users' },
  { id: 'analytics', label: 'Analytics', icon: 'analytics' },
  { id: 'content', label: 'Contenu', icon: 'content' },
  { id: 'stockAlerts', label: 'Alertes Stock', icon: 'alerts' },
  { id: 'settings', label: 'Réglages', icon: 'settings' }
];

const iconMap: Record<string, React.ReactNode> = {
  home: <Home size={20} />,
  package: <Package size={20} />,
  cart: <ShoppingCart size={20} />,
  users: <Users size={20} />,
  analytics: <BarChart3 size={20} />,
  settings: <Settings size={20} />,
  content: <FileText size={20} />,
  alerts: <AlertTriangle size={20} />,
  qa: <CheckSquare size={20} />,
  categories: <Tag size={20} />
};

interface DesktopSidebarProps {
  currentScreen: AdminScreen;
  onNavigate: (screen: AdminScreen) => void;
  onLogout: () => void;
  lowStockCount?: number;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentScreen,
  onNavigate,
  onLogout,
  lowStockCount = 0
}) => {
  const getIcon = (iconName: string) => iconMap[iconName] || <Package size={20} />;

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#0A0A0A] border-r border-brand-gold/20 min-h-screen fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-brand-gold/20">
        <Link href="/" className="block">
          <img
            src="/images/LOGOSITE/logo.png"
            alt="HP Collection"
            className="w-32 h-10 object-contain filter brightness-110"
          />
        </Link>
        <p className="text-xs text-brand-text-muted mt-2 uppercase tracking-wider">
          Administration
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = currentScreen === item.id;
          const showBadge = item.id === 'stockAlerts' && lowStockCount > 0;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              type="button"
              aria-label={`Aller à ${item.label}`}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? 'bg-brand-gold text-[#0A0A0A]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                {getIcon(item.icon)}
                <span className="font-medium text-sm">{item.label}</span>
              </div>
              {showBadge && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                  {lowStockCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-brand-gold/20">
        <button
          onClick={onLogout}
          type="button"
          aria-label="Se déconnecter"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut size={18} />
          <span className="font-medium text-sm">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};

interface BottomTabsProps {
  currentScreen: AdminScreen;
  onNavigate: (screen: AdminScreen) => void;
  lowStockCount?: number;
}

export const BottomTabs: React.FC<BottomTabsProps> = ({
  currentScreen,
  onNavigate,
  lowStockCount = 0
}) => {
  const getIcon = (iconName: string) => iconMap[iconName] || <Package size={20} />;
  const mobileItems = ADMIN_NAV_ITEMS.slice(0, 5);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-brand-gold/20 z-40 safe-area-bottom">
      <div className="grid grid-cols-5 gap-1">
        {mobileItems.map((item) => {
          const isActive = currentScreen === item.id;
          const showBadge = item.id === 'stockAlerts' && lowStockCount > 0;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              type="button"
              aria-label={`Aller à ${item.label}`}
              className={`flex flex-col items-center justify-center py-3 px-2 cursor-pointer ${
                isActive ? 'text-brand-gold' : 'text-gray-400'
              }`}
            >
              <div className="relative">
                {getIcon(item.icon)}
                {showBadge && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {lowStockCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export const AdminCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`bg-brand-bg-alt border border-brand-gold/15 rounded-xl p-6 shadow-lg ${className}`}
  >
    {children}
  </div>
);

export const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}> = ({ title, value, icon, trend, trendValue }) => (
  <AdminCard>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-brand-text-muted uppercase tracking-wider mb-1">
          {title}
        </p>
        <p className="text-3xl font-bebas text-brand-text">{value}</p>
        {trend && trendValue && (
          <p
            className={`text-sm mt-2 ${
              trend === 'up'
                ? 'text-green-500'
                : trend === 'down'
                ? 'text-red-500'
                : 'text-gray-400'
            }`}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
          </p>
        )}
      </div>
      {icon && (
        <div className="p-3 bg-brand-gold/10 rounded-lg text-brand-gold">{icon}</div>
      )}
    </div>
  </AdminCard>
);

export const AdminButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = ''
}) => {
  const baseClasses = 'font-bebas uppercase tracking-wider rounded transition-all cursor-pointer flex items-center justify-center gap-2';
  
  const variantClasses = {
    primary: 'bg-brand-gold hover:bg-brand-gold-light text-[#0A0A0A]',
    secondary: 'bg-white/10 hover:bg-white/20 text-white border border-brand-gold/30',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    success: 'bg-green-500 hover:bg-green-600 text-white'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
      aria-label={typeof children === 'string' ? children : undefined}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
};

export const AdminInput: React.FC<{
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'email' | 'password' | 'tel';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  error,
  className = ''
}) => (
  <div className={`space-y-1 ${className}`}>
    {label && (
      <label className="block text-sm font-medium text-brand-text">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      aria-label={label || placeholder}
      className={`w-full px-4 py-2.5 bg-brand-bg border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
        error
          ? 'border-red-500 focus:ring-red-500/30'
          : 'border-brand-gold/20 focus:ring-brand-gold/30 focus:border-brand-gold'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    />
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);

export const AdminSelect: React.FC<{
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}> = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  disabled = false,
  error,
  className = ''
}) => (
  <div className={`space-y-1 ${className}`}>
    {label && (
      <label className="block text-sm font-medium text-brand-text">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-label={label || placeholder}
      className={`w-full px-4 py-2.5 bg-brand-bg border rounded-lg focus:outline-none focus:ring-2 transition-colors cursor-pointer ${
        error
          ? 'border-red-500 focus:ring-red-500/30'
          : 'border-brand-gold/20 focus:ring-brand-gold/30 focus:border-brand-gold'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);

export const AdminTextarea: React.FC<{
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  rows?: number;
  className?: string;
}> = ({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  rows = 4,
  className = ''
}) => (
  <div className={`space-y-1 ${className}`}>
    {label && (
      <label className="block text-sm font-medium text-brand-text">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      aria-label={label || placeholder}
      className={`w-full px-4 py-2.5 bg-brand-bg border rounded-lg focus:outline-none focus:ring-2 transition-colors resize-none ${
        error
          ? 'border-red-500 focus:ring-red-500/30'
          : 'border-brand-gold/20 focus:ring-brand-gold/30 focus:border-brand-gold'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    />
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);

export const AdminBadge: React.FC<{
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}> = ({ children, variant = 'default', size = 'md' }) => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm'
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </span>
  );
};

export const OrderStatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const statusConfig: Record<OrderStatus, { variant: 'warning' | 'info' | 'success' | 'danger'; label: string }> = {
    'EN ATTENTE': { variant: 'warning', label: 'En attente' },
    'CONFIRMÉE': { variant: 'info', label: 'Confirmée' },
    'EN LIVRAISON': { variant: 'info', label: 'En livraison' },
    'LIVRÉE': { variant: 'success', label: 'Livrée' },
    'ANNULÉE': { variant: 'danger', label: 'Annulée' }
  };

  const config = statusConfig[status];

  return <AdminBadge variant={config.variant}>{config.label}</AdminBadge>;
};

export const AdminModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      />

      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-brand-bg rounded-2xl border border-brand-gold/30 shadow-2xl" role="document">
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-brand-gold/10 bg-brand-bg">
          <h2 id="modal-title" className="font-bebas text-2xl tracking-wider text-brand-text uppercase">
            {title}
          </h2>
          <button
            onClick={onClose}
            type="button"
            aria-label="Fermer"
            className="p-2 hover:bg-brand-gold/10 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} className="text-brand-text" />
          </button>
        </div>

        <div className="p-6">{children}</div>

        {footer && (
          <div className="sticky bottom-0 p-6 border-t border-brand-gold/10 bg-brand-bg-alt">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

interface TableColumn {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

export const AdminTable: React.FC<{
  columns: TableColumn[];
  data: Record<string, unknown>[];
  onRowClick?: (row: Record<string, unknown>) => void;
  emptyMessage?: string;
}> = ({ columns, data, onRowClick, emptyMessage = 'Aucune donnée' }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b border-brand-gold/20">
          {columns.map((col) => (
            <th
              key={col.key}
              className="text-left py-3 px-4 text-sm font-bebas uppercase tracking-wider text-brand-text-muted"
              scope="col"
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="py-8 text-center text-brand-text-muted">
              {emptyMessage}
            </td>
          </tr>
        ) : (
          data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-brand-gold/10 transition-colors ${
                onRowClick ? 'cursor-pointer hover:bg-brand-gold/5' : ''
              }`}
            >
              {columns.map((col) => (
                <td key={col.key} className="py-3 px-4 text-sm text-brand-text">
                  {col.render ? col.render(row[col.key], row) : (row[col.key] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export const AdminSearch: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder = 'Rechercher...', className = '' }) => (
  <div className={`relative ${className}`}>
    <Search
      size={18}
      className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted"
      aria-hidden="true"
    />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label="Recherche"
      className="w-full pl-10 pr-4 py-2.5 bg-brand-bg-alt border border-brand-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold text-brand-text"
    />
  </div>
);

export const AdminEmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="text-center py-12">
    {icon && (
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-gold/10 text-brand-gold mb-4">
        {icon}
      </div>
    )}
    <h3 className="font-bebas text-2xl tracking-wider text-brand-text uppercase mb-2">
      {title}
    </h3>
    {description && (
      <p className="text-brand-text-muted mb-6">{description}</p>
    )}
    {action && <div>{action}</div>}
  </div>
);