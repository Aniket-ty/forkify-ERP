// src/components/common/ScreenHeader.js
// Shared header used by every detail/sub screen.
// iOS: large ‹ chevron (native feel) + optional right action
// Android: ← arrow (material feel)
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../theme';

export default function ScreenHeader({
  title,
  subtitle,
  onBack,          // override default router.back()
  right,           // optional right-side element (e.g. a button)
  noBorder = false,
}) {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const isIOS   = Platform.OS === 'ios';

  const handleBack = () => {
    if (onBack) { onBack(); return; }
    if (router.canGoBack()) router.back();
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + (isIOS ? 4 : StatusBar.currentHeight ?? 0) },
        !noBorder && styles.border,
      ]}
    >
      <TouchableOpacity
        style={styles.backBtn}
        onPress={handleBack}
        activeOpacity={0.6}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.backIcon}>{isIOS ? '‹' : '←'}</Text>
      </TouchableOpacity>

      <View style={styles.titleWrap}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>

      <View style={styles.right}>
        {right || null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.card,
    paddingBottom:   Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width:           40,
    height:          40,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: Colors.bg,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    flexShrink:      0,
  },
  backIcon: {
    fontSize:   Platform.OS === 'ios' ? 28 : 20,
    color:      Colors.text,
    lineHeight: Platform.OS === 'ios' ? 32 : 26,
    fontWeight: Platform.OS === 'ios' ? '300' : '400',
    marginTop:  Platform.OS === 'ios' ? -2 : 0,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize:   Typography.lg,
    fontWeight: '700',
    color:      Colors.text,
  },
  subtitle: {
    fontSize:  Typography.xs,
    color:     Colors.textMuted,
    marginTop: 1,
  },
  right: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
