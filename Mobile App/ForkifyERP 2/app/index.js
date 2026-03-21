// app/index.js
import { Redirect } from 'expo-router';
import { useSelector } from 'react-redux';

export default function Index() {
  const { isAuthenticated } = useSelector((s) => s.auth);
  return <Redirect href={isAuthenticated ? '/(app)/(tabs)/dashboard' : '/(auth)/login'} />;
}
