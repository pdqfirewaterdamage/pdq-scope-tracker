import React from 'react';
import { Stack } from 'expo-router';
import { PDQ_BLUE, PDQ_LIGHT, PDQ_DARK } from '../../constants/colors';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: PDQ_BLUE },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        contentStyle: { backgroundColor: PDQ_LIGHT },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'PDQ Scope Tracker' }}
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
