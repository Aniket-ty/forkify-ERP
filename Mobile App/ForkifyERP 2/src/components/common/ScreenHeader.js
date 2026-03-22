// src/components/common/ScreenHeader.js — v3
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';

export default function ScreenHeader({ title, subtitle, onBack, right, noBorder = false, transparent = false }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) { onBack(); return; }
    if (router.canGoBack()) router.back();
  };

  return (
    <View style={[
      styles.container,
      { paddingTop: insets.top + 6 },
      !noBorder && styles.border,
      transparent && styles.transparent,
    ]}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={handleBack}
        activeOpacity={0.65}
        hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
      >
        <Ionicons
          name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
          size={22}
          color={Colors.text}
        />
      </TouchableOpacity>

      <View style={styles.titleWrap}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? (
          typeof subtitle === 'string'
            ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
            : subtitle
        ) : null}
      </View>

      <View style={styles.right}>{right || <View style={{ width: 40 }} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: 10,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  transparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexShrink: 0,
  },
  titleWrap: { flex: 1 },
  title: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 1,
    fontWeight: '500',
  },
  right: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
