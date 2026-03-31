import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { BG_HEADER, BG_APP, PDQ_GREEN, TEXT_PRIMARY } from '../../constants/colors';

function HomeButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.replace('/(app)')}
      style={styles.homeBtn}
      activeOpacity={0.7}
    >
      <Text style={styles.homeBtnText}>{'\u2302'}</Text>
    </TouchableOpacity>
  );
}

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: BG_HEADER },
        headerTintColor: TEXT_PRIMARY,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        contentStyle: { backgroundColor: BG_APP },
        headerBackTitle: 'Back',
        headerShadowVisible: false,
        headerRight: () => <HomeButton />,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: false, headerRight: undefined }}
      />
      <Stack.Screen
        name="scope/login"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="scope/kpi"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="scope/index"
        options={{ title: 'Scope Tracker' }}
      />
      <Stack.Screen
        name="psycorp"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="project/[id]"
        options={{ title: 'Project' }}
      />
      <Stack.Screen
        name="project/tech/[id]"
        options={{ title: 'Tech Sheet' }}
      />
      <Stack.Screen
        name="project/estimator/[id]"
        options={{ title: 'Estimator View' }}
      />
      <Stack.Screen
        name="scope/debug"
        options={{ title: 'Storage Debug' }}
      />
      <Stack.Screen
        name="scope/whats-new"
        options={{ title: "What's New" }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  homeBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  homeBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
});
