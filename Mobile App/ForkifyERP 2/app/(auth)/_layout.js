// app/(auth)/_layout.js
import { Stack } from 'expo-router';
import { useSelector } from 'react-redux';
import { Redirect } from 'expo-router';

export default function AuthLayout() {
  const { isAuthenticated } = useSelector((s) => s.auth);
  if (isAuthenticated) return <Redirect href="/(app)/(tabs)/dashboard" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
