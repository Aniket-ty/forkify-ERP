// app/(auth)/login.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { loginThunk, registerThunk, clearError } from '../../src/store';
import { Colors, Typography, Radius, Spacing, Shadow } from '../../src/theme';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [localError, setLocalError] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '', fullName: '' });

  const dispatch = useDispatch();
  const router   = useRouter();
  const { loading, error, isAuthenticated, message } = useSelector((s) => s.auth);

  useEffect(() => {
    if (isAuthenticated) router.replace('/(app)/(tabs)/dashboard');
  }, [isAuthenticated]);

  useEffect(() => () => { dispatch(clearError()); }, []);

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setLocalError(null);
    if (error) dispatch(clearError());
  };

  const validate = () => {
    if (isLogin) {
      if (!form.username.trim() || !form.password) return 'Please fill in all fields';
      if (form.username.length < 3) return 'Username must be at least 3 characters';
      if (form.password.length < 6) return 'Password must be at least 6 characters';
    } else {
      if (!form.fullName.trim() || !form.username.trim() || !form.email.trim() || !form.password || !form.confirmPassword)
        return 'Please fill in all fields';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Enter a valid email address';
      if (form.password.length < 6) return 'Password must be at least 6 characters';
      if (form.password !== form.confirmPassword) return 'Passwords do not match';
      if (form.username.length < 3) return 'Username must be at least 3 characters';
    }
    return null;
  };

  const handleSubmit = async () => {
    const validErr = validate();
    if (validErr) { setLocalError(validErr); return; }

    if (isLogin) {
      dispatch(loginThunk({ username: form.username.trim(), password: form.password }));
    } else {
      const result = await dispatch(registerThunk({
        username: form.username.trim(), email: form.email.trim(),
        password: form.password, fullName: form.fullName.trim(),
      }));
      if (!result.error) {
        dispatch(loginThunk({ username: form.username.trim(), password: form.password }));
      }
    }
  };

  const toggle = () => {
    setIsLogin(!isLogin);
    setLocalError(null);
    dispatch(clearError());
    setForm({ username: '', email: '', password: '', confirmPassword: '', fullName: '' });
  };

  const displayError = localError || error;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={S.container}
        keyboardShouldPersistTaps="handled"
        style={{ backgroundColor: Colors.bg }}
      >
        {/* Brand */}
        <View style={S.brand}>
          <View style={S.logoCircle}>
            <Text style={S.logoIcon}>🍴</Text>
          </View>
          <Text style={S.brandName}>Forkify ERP</Text>
          <Text style={S.brandSub}>Restaurant Management System</Text>
        </View>

        {/* Card */}
        <View style={[S.card, Shadow.md]}>
          <Text style={S.cardTitle}>{isLogin ? 'Welcome back' : 'Create account'}</Text>
          <Text style={S.cardSub}>
            {isLogin ? 'Sign in with your credentials' : 'Fill in details to get started'}
          </Text>

          {!!displayError && (
            <View style={S.errorBanner}>
              <Text style={S.errorText}>⚠️  {displayError}</Text>
            </View>
          )}
          {!!message && !displayError && (
            <View style={S.successBanner}>
              <Text style={S.successText}>✓  {message}</Text>
            </View>
          )}

          {!isLogin && (
            <View style={S.field}>
              <Text style={S.label}>Full Name</Text>
              <TextInput style={S.input} value={form.fullName} onChangeText={v => set('fullName', v)}
                placeholder="Enter your full name" placeholderTextColor={Colors.textMuted} editable={!loading} />
            </View>
          )}

          <View style={S.field}>
            <Text style={S.label}>{isLogin ? 'Username' : 'Username'}</Text>
            <TextInput style={S.input} value={form.username} onChangeText={v => set('username', v)}
              placeholder={isLogin ? 'Enter your username' : 'At least 3 characters'}
              placeholderTextColor={Colors.textMuted} autoCapitalize="none" autoCorrect={false}
              editable={!loading} />
          </View>

          {!isLogin && (
            <View style={S.field}>
              <Text style={S.label}>Email Address</Text>
              <TextInput style={S.input} value={form.email} onChangeText={v => set('email', v)}
                placeholder="Enter your email" placeholderTextColor={Colors.textMuted}
                keyboardType="email-address" autoCapitalize="none" editable={!loading} />
            </View>
          )}

          <View style={S.field}>
            <Text style={S.label}>Password</Text>
            <TextInput style={S.input} value={form.password} onChangeText={v => set('password', v)}
              placeholder={isLogin ? 'Enter your password' : 'Min. 6 characters'}
              placeholderTextColor={Colors.textMuted} secureTextEntry editable={!loading} />
          </View>

          {!isLogin && (
            <View style={S.field}>
              <Text style={S.label}>Confirm Password</Text>
              <TextInput style={S.input} value={form.confirmPassword} onChangeText={v => set('confirmPassword', v)}
                placeholder="Confirm your password" placeholderTextColor={Colors.textMuted}
                secureTextEntry editable={!loading} />
            </View>
          )}

          <TouchableOpacity
            style={[S.submitBtn, loading && S.submitBtnDisabled]}
            onPress={handleSubmit} disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={S.submitText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>}
          </TouchableOpacity>

          <View style={S.footer}>
            <Text style={S.footerText}>{isLogin ? "Don't have an account?" : 'Already have an account?'}</Text>
            <TouchableOpacity onPress={toggle} disabled={loading}>
              <Text style={S.toggleText}>{isLogin ? ' Sign Up' : ' Sign In'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={S.version}>Forkify ERP  v2.1.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  container:        { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  brand:            { alignItems: 'center', marginBottom: Spacing.xxl },
  logoCircle:       { width: 72, height: 72, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoIcon:         { fontSize: 36 },
  brandName:        { fontSize: Typography.h1, fontWeight: '800', color: Colors.text },
  brandSub:         { fontSize: Typography.sm, color: Colors.textMuted, marginTop: 4 },
  card:             { width: '100%', maxWidth: 400, backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.xxl },
  cardTitle:        { fontSize: Typography.xl, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  cardSub:          { fontSize: Typography.sm, color: Colors.textMuted, marginBottom: Spacing.xl },
  errorBanner:      { backgroundColor: Colors.dangerLight, borderWidth: 1, borderColor: '#fecaca', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
  errorText:        { color: Colors.danger, fontSize: Typography.sm },
  successBanner:    { backgroundColor: Colors.successLight, borderWidth: 1, borderColor: '#bbf7d0', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
  successText:      { color: '#15803d', fontSize: Typography.sm },
  field:            { marginBottom: Spacing.md },
  label:            { fontSize: Typography.sm, fontWeight: '600', color: '#374151', marginBottom: 5 },
  input:            { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 11, fontSize: Typography.base, color: Colors.text, backgroundColor: Colors.card },
  submitBtn:        { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  submitBtnDisabled:{ opacity: 0.7 },
  submitText:       { color: '#fff', fontSize: Typography.md, fontWeight: '700' },
  footer:           { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  footerText:       { fontSize: Typography.sm, color: Colors.textMuted },
  toggleText:       { fontSize: Typography.sm, fontWeight: '700', color: Colors.primary },
  version:          { marginTop: Spacing.xl, fontSize: Typography.xs, color: Colors.textMuted },
});
