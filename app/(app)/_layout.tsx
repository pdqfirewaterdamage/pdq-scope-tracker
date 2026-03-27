import React from 'react';
import { Stack } from 'expo-router';
import { BG_HEADER, BG_APP, PDQ_GREEN, BORDER_COLOR, TEXT_PRIMARY } from '../../constants/colors';

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
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="scope/index"
        options={{ title: 'Scope Tracker' }}
      />
      <Stack.Screen
        name="psycorp"
        options={{ title: 'Psycorp Calculator' }}
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
    </Stack>
  );
}
