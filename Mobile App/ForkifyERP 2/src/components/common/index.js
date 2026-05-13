// src/components/common/index.js — Forkify Shared UI v3
import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../theme';

// ── LoadingScreen ─────────────────────────────────────────────────────────────
export const LoadingScreen = ({ message = 'Loading...' }) => (
  <View style={S.centered}>
    <View style={S.loaderWrap}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
    <Text style={S.loadingText}>{message}</Text>
  </View>
);

// ── EmptyState ────────────────────────────────────────────────────────────────
export const EmptyState = ({ icon = '📭', title, subtitle, action, actionLabel }) => (
  <View style={S.emptyState}>
    <View style={S.emptyIconWrap}>
      <Text style={S.emptyIcon}>{icon}</Text>
    </View>
    <Text style={S.emptyTitle}>{title}</Text>
    {subtitle && <Text style={S.emptySubtitle}>{subtitle}</Text>}
    {action && (
      <TouchableOpacity style={S.emptyAction} onPress={action} activeOpacity={0.8}>
        <Text style={S.emptyActionText}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ── Banner ────────────────────────────────────────────────────────────────────
export const Banner = ({ type = 'error', message, onDismiss }) => {
  const cfg = {
    error:   { bg: '#fef2f2', border: '#fecaca',  text: '#dc2626', icon: 'alert-circle' },
    success: { bg: '#f0fdf4', border: '#bbf7d0',  text: '#15803d', icon: 'checkmark-circle' },
    warning: { bg: '#fffbeb', border: '#fde68a',  text: '#92400e', icon: 'warning' },
    info:    { bg: '#eff6ff', border: '#bfdbfe',  text: Colors.primary, icon: 'information-circle' },
  }[type] || { bg: '#f9fafb', border: '#e5e7eb', text: '#374151', icon: 'information-circle' };

  if (!message) return null;
  return (
    <View style={[S.banner, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <Ionicons name={cfg.icon} size={16} color={cfg.text} style={{ flexShrink: 0 }} />
      <Text style={[S.bannerText, { color: cfg.text }]}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={16} color={cfg.text} />
        </TouchableOpacity>
      )}
    </View>
  );
};

// ── Card ──────────────────────────────────────────────────────────────────────
export const Card = ({ children, style, padding = Spacing.lg }) => (
  <View style={[S.card, { padding }, Shadow.card, style]}>{children}</View>
);

// ── SectionHeader ─────────────────────────────────────────────────────────────
export const SectionHeader = ({ title, subtitle, right }) => (
  <View style={S.sectionHeader}>
    <View style={{ flex: 1 }}>
      <Text style={S.sectionTitle}>{title}</Text>
      {subtitle && <Text style={S.sectionSubtitle}>{subtitle}</Text>}
    </View>
    {right}
  </View>
);

// ── PrimaryButton ─────────────────────────────────────────────────────────────
export const PrimaryButton = ({ label, onPress, loading, disabled, danger, outline, small, style, icon }) => {
  const isDisabled = disabled || loading;
  const bg      = danger ? Colors.danger : outline ? 'transparent' : Colors.primary;
  const border  = danger ? Colors.danger : Colors.primary;
  const textCol = danger ? '#fff' : outline ? Colors.primary : '#fff';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.82}
      style={[
        S.btn,
        small && S.btnSmall,
        { backgroundColor: bg, borderColor: border, opacity: isDisabled ? 0.55 : 1 },
        !outline && !danger && Shadow.xs,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textCol} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={small ? 14 : 16} color={textCol} />}
          <Text style={[S.btnText, small && S.btnTextSmall, { color: textCol }]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

// ── IconButton ────────────────────────────────────────────────────────────────
export const IconButton = ({ onPress, disabled, style, children, name, size = 20, color }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.7}
    style={[S.iconBtn, style, { opacity: disabled ? 0.5 : 1 }]}
  >
    {name ? <Ionicons name={name} size={size} color={color || Colors.textSecondary} /> : children}
  </TouchableOpacity>
);

// ── SearchBar ─────────────────────────────────────────────────────────────────
export const SearchBar = ({ value, onChange, placeholder = 'Search...' }) => (
  <View style={S.searchBar}>
    <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={Colors.textMuted}
      style={S.searchInput}
    />
    {!!value && (
      <TouchableOpacity onPress={() => onChange('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    )}
  </View>
);

// ── StatusBadge ───────────────────────────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const cfg = {
    ACTIVE:       { bg: '#dcfce7', color: '#15803d' },
    DRAFT:        { bg: '#fef9c3', color: '#a16207' },
    ARCHIVED:     { bg: '#f1f5f9', color: '#64748b' },
    PENDING:      { bg: '#fffbeb', color: '#a16207' },
    APPROVED:     { bg: '#f0fdf4', color: '#15803d' },
    REJECTED:     { bg: '#fef2f2', color: '#dc2626' },
    GOOD:         { bg: '#f0fdf4', color: '#15803d' },
    WARNING:      { bg: '#fffbeb', color: '#a16207' },
    LOW:          { bg: Colors.primaryLight, color: Colors.primaryDark },
    CRITICAL:     { bg: '#fef2f2', color: '#b91c1c' },
    OUT_OF_STOCK: { bg: '#f1f5f9', color: '#475569' },
    SENT:         { bg: Colors.primaryLight, color: Colors.primary },
    RECEIVED:     { bg: '#f0fdf4', color: '#0a6640' },
    CANCELLED:    { bg: '#fef2f2', color: '#dc2626' },
    PARTIALLY_RECEIVED: { bg: '#fef3c7', color: '#d97706' },
  }[status] || { bg: Colors.borderLight, color: Colors.textSecondary };

  return (
    <View style={[S.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[S.badgeText, { color: cfg.color }]}>{status?.replace(/_/g, ' ')}</Text>
    </View>
  );
};

// ── KpiCard ───────────────────────────────────────────────────────────────────
export const KpiCard = ({ title, value, change, trend, icon, color }) => {
  const accentColor = color || Colors.primary;
  return (
    <View style={[S.kpiCard, Shadow.card]}>
      <View style={[S.kpiIconWrap, { backgroundColor: accentColor + '18' }]}>
        <Text style={S.kpiEmoji}>{icon}</Text>
      </View>
      <Text style={[S.kpiValue, { color: accentColor }]}>{value}</Text>
      <Text style={S.kpiTitle}>{title}</Text>
      {change !== undefined && (
        <View style={S.kpiChangeRow}>
          <Ionicons
            name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove'}
            size={11}
            color={trend === 'up' ? Colors.success : trend === 'down' ? Colors.danger : Colors.textMuted}
          />
          <Text style={[S.kpiChange, {
            color: trend === 'up' ? Colors.success : trend === 'down' ? Colors.danger : Colors.textMuted
          }]}>{change}</Text>
        </View>
      )}
    </View>
  );
};

// ── FormField ─────────────────────────────────────────────────────────────────
export const FormField = ({ label, children, required, hint }) => (
  <View style={S.formField}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
      <Text style={S.formLabel}>{label}</Text>
      {required && <Text style={S.formRequired}> *</Text>}
    </View>
    {children}
    {hint && <Text style={S.formHint}>{hint}</Text>}
  </View>
);

export const FormInput = ({ value, onChangeText, placeholder, keyboardType, multiline, editable = true, style, icon }) => (
  <View style={[S.inputWrap, !editable && S.inputDisabled]}>
    {icon && <Ionicons name={icon} size={16} color={Colors.textMuted} style={{ marginLeft: 4 }} />}
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.textMuted}
      keyboardType={keyboardType}
      multiline={multiline}
      editable={editable}
      style={[
        S.formInput,
        icon && { paddingLeft: 4 },
        multiline && { height: 88, textAlignVertical: 'top' },
        !editable && { color: Colors.textSecondary },
        style,
      ]}
    />
  </View>
);

// ── ProgressBar ───────────────────────────────────────────────────────────────
export const ProgressBar = ({ percent, color, height = 5, rounded = true }) => (
  <View style={[S.progressTrack, { height, borderRadius: rounded ? height : 0 }]}>
    <View style={[
      S.progressFill,
      { width: `${Math.min(100, Math.max(0, percent))}%`, backgroundColor: color || Colors.primary, borderRadius: rounded ? height : 0 }
    ]} />
  </View>
);

// ── Chip ──────────────────────────────────────────────────────────────────────
export const Chip = ({ label, color, bg, icon }) => (
  <View style={[S.chip, { backgroundColor: bg || Colors.primaryLight }]}>
    {icon && <Ionicons name={icon} size={11} color={color || Colors.primary} />}
    <Text style={[S.chipText, { color: color || Colors.primary }]}>{label}</Text>
  </View>
);

// ── Divider ───────────────────────────────────────────────────────────────────
export const Divider = ({ style }) => <View style={[S.divider, style]} />;

// ── Styles ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  centered:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: Colors.bg },
  loaderWrap:    { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  loadingText:   { fontSize: Typography.sm, color: Colors.textMuted, fontWeight: '500' },

  emptyState:    { alignItems: 'center', justifyContent: 'center', padding: Spacing.xxxl, gap: 10 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyIcon:     { fontSize: 32 },
  emptyTitle:    { fontSize: Typography.lg, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  emptySubtitle: { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  emptyAction:   { marginTop: 8, paddingHorizontal: 20, paddingVertical: 11, backgroundColor: Colors.primary, borderRadius: Radius.lg },
  emptyActionText:{ fontSize: Typography.base, fontWeight: '600', color: '#fff' },

  banner:        { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, marginBottom: Spacing.md },
  bannerText:    { flex: 1, fontSize: Typography.sm, lineHeight: 18 },

  card:          { backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle:  { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  sectionSubtitle:{ fontSize: Typography.sm, color: Colors.textMuted, marginTop: 2 },

  btn:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 12, borderRadius: Radius.md, borderWidth: 1.5 },
  btnSmall:      { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.sm, borderWidth: 1 },
  btnText:       { fontSize: Typography.base, fontWeight: '600', letterSpacing: 0.1 },
  btnTextSmall:  { fontSize: Typography.sm, fontWeight: '600' },

  iconBtn:       { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },

  searchBar:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 11, backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
  searchInput:   { flex: 1, fontSize: Typography.base, color: Colors.text },

  badge:         { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.sm },
  badgeText:     { fontSize: Typography.xs, fontWeight: '700', letterSpacing: 0.2 },

  kpiCard:       { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: 4 },
  kpiIconWrap:   { width: 38, height: 38, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  kpiEmoji:      { fontSize: 18 },
  kpiValue:      { fontSize: Typography.xl, fontWeight: '800', letterSpacing: -0.5 },
  kpiTitle:      { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: '500' },
  kpiChangeRow:  { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  kpiChange:     { fontSize: Typography.xs, fontWeight: '600' },

  formField:     { marginBottom: Spacing.md },
  formLabel:     { fontSize: Typography.sm, fontWeight: '600', color: Colors.textSecondary },
  formRequired:  { fontSize: Typography.sm, fontWeight: '700', color: Colors.danger },
  formHint:      { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 4 },
  inputWrap:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, backgroundColor: Colors.card, paddingHorizontal: 12 },
  inputDisabled: { backgroundColor: Colors.bgDark },
  formInput:     { flex: 1, paddingVertical: 11, fontSize: Typography.base, color: Colors.text },

  progressTrack: { backgroundColor: Colors.borderLight, overflow: 'hidden' },
  progressFill:  {},

  chip:          { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  chipText:      { fontSize: Typography.xs, fontWeight: '600' },

  divider:       { height: 1, backgroundColor: Colors.borderLight },
});

export { default as ScreenHeader } from './ScreenHeader';
