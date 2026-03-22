// src/theme/index.js — Forkify ERP Design Tokens v3
export const Colors = {
  // Brand
  primary:      '#1d5fe8',
  primaryLight: '#e8f0fe',
  primaryDark:  '#1750cc',
  primaryMid:   '#3b7ff5',

  // Semantic
  success:      '#10b981',
  successLight: '#ecfdf5',
  successDark:  '#059669',
  danger:       '#ef4444',
  dangerLight:  '#fef2f2',
  warning:      '#f59e0b',
  warningLight: '#fffbeb',
  info:         '#06b6d4',
  infoLight:    '#ecfeff',

  // Neutrals
  bg:           '#f5f7fb',
  bgDark:       '#eef1f8',
  card:         '#ffffff',
  cardAlt:      '#fafbff',
  border:       '#e8ecf4',
  borderLight:  '#f0f3f9',

  // Text
  text:         '#111827',
  textSecondary:'#4b5563',
  textMuted:    '#9ca3af',
  textLight:    '#d1d5db',

  // Navigation
  navBg:        '#0f172a',
  navActive:    '#1d5fe8',
  navText:      'rgba(255,255,255,0.6)',
  navTextActive:'#ffffff',

  // Gradients (used as arrays in LinearGradient)
  gradBlue:     ['#1d5fe8', '#3b7ff5'],
  gradGreen:    ['#059669', '#10b981'],
  gradDark:     ['#0f172a', '#1e293b'],
  gradCard:     ['#ffffff', '#f8faff'],

  // Status chips
  statusDraft:      '#fef9c3', statusDraftText:   '#a16207',
  statusActive:     '#dcfce7', statusActiveText:  '#15803d',
  statusArchived:   '#f1f5f9', statusArchivedText:'#64748b',
};

export const Typography = {
  xs:   11,
  sm:   12,
  base: 13,
  md:   14,
  lg:   16,
  xl:   18,
  xxl:  22,
  h1:   28,
  h2:   24,
};

export const Radius = {
  xs:   4,
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  xxl:  28,
  full: 999,
};

export const Shadow = {
  xs: {
    shadowColor: '#1d5fe8',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#1d5fe8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 12,
  },
  card: {
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
};

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
};
