// app/(app)/_layout.js
import { Stack } from 'expo-router';
import { useSelector } from 'react-redux';
import { Redirect } from 'expo-router';

export default function AppLayout() {
  const { isAuthenticated } = useSelector((s) => s.auth);
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
