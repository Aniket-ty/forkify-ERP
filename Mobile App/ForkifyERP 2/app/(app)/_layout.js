// app/(app)/_layout.js
import { Stack } from 'expo-router';
import { useSelector } from 'react-redux';
import { Redirect } from 'expo-router';
import { Platform } from 'react-native';

export default function AppLayout() {
  const { isAuthenticated } = useSelector((s) => s.auth);
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Re-enable iOS native swipe-back gesture on all screens
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        // Smooth native slide animation on both platforms
        animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right',
        // Wider swipe hit area on iOS (default is only left edge)
        fullScreenGestureEnabled: true,
      }}
    />
  );
}
