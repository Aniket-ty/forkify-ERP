// app/_layout.js — Root layout
// gesture-handler MUST be first import
import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import store, { initAuthThunk } from '../src/store';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../src/theme';

function RootNavigator() {
  const dispatch = useDispatch();
  const { initialized } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(initAuthThunk());
  }, []);

  if (!initialized) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <Provider store={store}>
        <RootNavigator />
      </Provider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
});
