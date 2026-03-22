// src/components/common/index.js — Shared UI building blocks

import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, TextInput, ScrollView,
} from 'react-native';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../theme';

// ── LoadingScreen ─────────────────────────────────────────────────────────────
export const LoadingScreen = ({ message = 'Loading...' }) => (
  <View style={sharedStyles.centered}>
    <ActivityIndicator size="large" color={Colors.primary} />
    <Text style={sharedStyles.loadingText}>{message}</Text>
  </View>
);

// ── EmptyState ────────────────────────────────────────────────────────────────
export const EmptyState = ({ icon, title, subtitle, action, actionLabel }) => (
  <View style={sharedStyles.emptyState}>
    {icon && <Text style={sharedStyles.emptyIcon}>{icon}</Text>}
    <Text style={sharedStyles.emptyTitle}>{title}</Text>
    {subtitle && <Text style={sharedStyles.emptySubtitle}>{subtitle}</Text>}
    {action && (
      <TouchableOpacity style={sharedStyles.emptyAction} onPress={action}>
        <Text style={sharedStyles.emptyActionText}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ── Banner ────────────────────────────────────────────────────────────────────
export const Banner = ({ type = 'error', message, onDismiss }) => {
  const cfg = {
    error:   { bg: Colors.dangerLight,   border: '#fecaca',  text: Colors.danger },
    success: { bg: Colors.successLight,  border: '#bbf7d0',  text: '#15803d' },
    warning: { bg: Colors.warningLight,  border: '#fde68a',  text: '#92400e' },
    info:    { bg: Colors.primaryLight,  border: '#b3ccf5',  text: Colors.primary },
  }[type];

  if (!message) return null;
  return (
    <View style={[sharedStyles.banner, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <Text style={[sharedStyles.bannerText, { color: cfg.text }]}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={sharedStyles.bannerClose}>
          <Text style={[sharedStyles.bannerCloseText, { color: cfg.text }]}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ── Card ──────────────────────────────────────────────────────────────────────
export const Card = ({ children, style, padding = Spacing.lg }) => (
  <View style={[sharedStyles.card, { padding }, Shadow.sm, style]}>{children}</View>
);

// ── SectionHeader ─────────────────────────────────────────────────────────────
export const SectionHeader = ({ title, subtitle, right }) => (
  <View style={sharedStyles.sectionHeader}>
    <View style={{ flex: 1 }}>
      <Text style={sharedStyles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={sharedStyles.sectionSubtitle}>{subtitle}</Text>}
    </View>
    {right}
  </View>
);

// ── PrimaryButton ─────────────────────────────────────────────────────────────
export const PrimaryButton = ({ label, onPress, loading, disabled, danger, outline, small, style }) => {
  const bg      = danger ? Colors.danger : outline ? 'transparent' : Colors.primaryLight;
  const border  = danger ? Colors.danger : Colors.primary;
  const textCol = danger ? '#fff' : Colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        sharedStyles.btn,
        small && sharedStyles.btnSmall,
        { backgroundColor: bg, borderColor: border, opacity: (disabled || loading) ? 0.6 : 1 },
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator size="small" color={textCol} />
        : <Text style={[sharedStyles.btnText, small && sharedStyles.btnTextSmall, { color: textCol }]}>{label}</Text>}
    </TouchableOpacity>
  );
};

// ── IconButton ────────────────────────────────────────────────────────────────
export const IconButton = ({ onPress, disabled, style, children }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[sharedStyles.iconBtn, style, { opacity: disabled ? 0.5 : 1 }]}
  >
    {children}
  </TouchableOpacity>
);

// ── SearchBar ─────────────────────────────────────────────────────────────────
export const SearchBar = ({ value, onChange, placeholder = 'Search...' }) => (
  <View style={sharedStyles.searchBar}>
    <Text style={sharedStyles.searchIcon}>🔍</Text>
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={Colors.textMuted}
      style={sharedStyles.searchInput}
    />
    {!!value && (
      <TouchableOpacity onPress={() => onChange('')}>
        <Text style={sharedStyles.searchClear}>✕</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ── StatusBadge ───────────────────────────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const cfg = {
    ACTIVE:    { bg: Colors.statusActive,    color: Colors.statusActiveText },
    DRAFT:     { bg: Colors.statusDraft,     color: Colors.statusDraftText },
    ARCHIVED:  { bg: Colors.statusArchived,  color: Colors.statusArchivedText },
    PENDING:   { bg: Colors.warningLight,    color: '#a16207' },
    APPROVED:  { bg: Colors.successLight,    color: '#15803d' },
    REJECTED:  { bg: Colors.dangerLight,     color: Colors.danger },
    GOOD:      { bg: '#f0fdf4',              color: '#15803d' },
    WARNING:   { bg: '#fefce8',              color: '#a16207' },
    LOW:       { bg: Colors.primaryLight,    color: Colors.primaryDark },
    CRITICAL:  { bg: Colors.dangerLight,     color: '#b91c1c' },
    OUT_OF_STOCK: { bg: '#f1f5f9',           color: '#475569' },
    SENT:      { bg: Colors.primaryLight,    color: Colors.primary },
    RECEIVED:  { bg: Colors.successLight,    color: '#0a6640' },
    CANCELLED: { bg: Colors.dangerLight,     color: Colors.danger },
  }[status] || { bg: Colors.borderLight, color: Colors.textSecondary };

  return (
    <View style={[sharedStyles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[sharedStyles.badgeText, { color: cfg.color }]}>{status}</Text>
    </View>
  );
};

// ── KpiCard ───────────────────────────────────────────────────────────────────
export const KpiCard = ({ title, value, change, trend, icon }) => (
  <View style={[sharedStyles.kpiCard, Shadow.sm]}>
    <View style={sharedStyles.kpiTop}>
      <Text style={sharedStyles.kpiIcon}>{icon}</Text>
      <Text style={[sharedStyles.kpiChange, { color: trend === 'up' ? Colors.success : trend === 'down' ? Colors.danger : Colors.textSecondary }]}>
        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''} {change}
      </Text>
    </View>
    <Text style={sharedStyles.kpiValue}>{value}</Text>
    <Text style={sharedStyles.kpiTitle}>{title}</Text>
  </View>
);

// ── FormField ─────────────────────────────────────────────────────────────────
export const FormField = ({ label, children, required }) => (
  <View style={sharedStyles.formField}>
    <Text style={sharedStyles.formLabel}>{label}{required && ' *'}</Text>
    {children}
  </View>
);

export const FormInput = ({ value, onChangeText, placeholder, keyboardType, multiline, editable = true, style }) => (
  <TextInput
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor={Colors.textMuted}
    keyboardType={keyboardType}
    multiline={multiline}
    editable={editable}
    style={[sharedStyles.formInput, multiline && { height: 80, textAlignVertical: 'top' }, !editable && { backgroundColor: '#f8fafc', color: Colors.textSecondary }, style]}
  />
);

// ── ProgressBar ───────────────────────────────────────────────────────────────
export const ProgressBar = ({ percent, color }) => (
  <View style={sharedStyles.progressTrack}>
    <View style={[sharedStyles.progressFill, { width: `${Math.min(100, percent)}%`, backgroundColor: color || Colors.primary }]} />
  </View>
);

// ── Styles ────────────────────────────────────────────────────────────────────
const sharedStyles = StyleSheet.create({
  centered:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:    { fontSize: Typography.base, color: Colors.textMuted, marginTop: 8 },

  emptyState:     { alignItems: 'center', justifyContent: 'center', padding: Spacing.xxxl, gap: 12 },
  emptyIcon:      { fontSize: 44 },
  emptyTitle:     { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  emptySubtitle:  { fontSize: Typography.base, color: Colors.textMuted, textAlign: 'center' },
  emptyAction:    { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.primaryLight, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.primary },
  emptyActionText:{ fontSize: Typography.base, fontWeight: '600', color: Colors.primary },

  banner:         { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, marginBottom: Spacing.md },
  bannerText:     { flex: 1, fontSize: Typography.base },
  bannerClose:    { marginLeft: 8, padding: 4 },
  bannerCloseText:{ fontSize: Typography.md, fontWeight: '600' },

  card:           { backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },

  sectionHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle:   { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  sectionSubtitle:{ fontSize: Typography.sm, color: Colors.textMuted, marginTop: 2 },

  btn:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1 },
  btnSmall:       { paddingHorizontal: 12, paddingVertical: 7 },
  btnText:        { fontSize: Typography.base, fontWeight: '600' },
  btnTextSmall:   { fontSize: Typography.sm },

  iconBtn:        { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },

  searchBar:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  searchIcon:     { fontSize: 14 },
  searchInput:    { flex: 1, fontSize: Typography.base, color: Colors.text },
  searchClear:    { fontSize: Typography.md, color: Colors.textMuted, paddingHorizontal: 4 },

  badge:          { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  badgeText:      { fontSize: Typography.xs, fontWeight: '700' },

  kpiCard:        { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  kpiTop:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  kpiIcon:        { fontSize: 20 },
  kpiChange:      { fontSize: Typography.xs, fontWeight: '600' },
  kpiValue:       { fontSize: Typography.xl, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  kpiTitle:       { fontSize: Typography.xs, color: Colors.textMuted },

  formField:      { gap: 5, marginBottom: Spacing.md },
  formLabel:      { fontSize: Typography.sm, fontWeight: '600', color: '#374151' },
  formInput:      { paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, fontSize: Typography.base, color: Colors.text, backgroundColor: Colors.card },

  progressTrack:  { height: 4, backgroundColor: Colors.borderLight, borderRadius: 2, overflow: 'hidden' },
  progressFill:   { height: 4, borderRadius: 2 },
});

export { default as ScreenHeader } from './ScreenHeader';
