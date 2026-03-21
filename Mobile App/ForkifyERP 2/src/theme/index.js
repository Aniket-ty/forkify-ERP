// src/theme/index.js — Forkify ERP Design Tokens

export const Colors = {
  primary:    '#0061d2',
  primaryLight: '#e8f0fd',
  primaryDark:  '#0052b3',
  accent:     '#10b981',
  danger:     '#ef4444',
  dangerLight:'#fef2f2',
  warning:    '#f59e0b',
  warningLight:'#fefce8',
  success:    '#10b981',
  successLight:'#f0fdf4',

  bg:         '#f0f2f7',
  card:       '#ffffff',
  border:     '#e5e7eb',
  borderLight:'#f1f5f9',

  text:       '#0d1017',
  textSecondary: '#6b7280',
  textMuted:  '#9ca3af',
  textLight:  '#d1d5db',

  sidebar:    '#0d1017',
  sidebarText:'rgba(255,255,255,0.75)',
  sidebarActive:'#0061d2',

  // Status
  statusDraft:     '#fef9c3',
  statusDraftText: '#a16207',
  statusActive:    '#dcfce7',
  statusActiveText:'#15803d',
  statusArchived:  '#f1f5f9',
  statusArchivedText:'#64748b',
};

export const Typography = {
  xs:   11,
  sm:   12,
  base: 13,
  md:   14,
  lg:   16,
  xl:   18,
  xxl:  20,
  h1:   24,
};

export const Radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};
