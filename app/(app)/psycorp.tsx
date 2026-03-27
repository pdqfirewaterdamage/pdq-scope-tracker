import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const PSYCORP_URL = 'https://pdqfirewaterdamage.github.io/pdq-sycorp-calculator/';

export default function PsycorpScreen() {
  const router = useRouter();

  const homeButton = (
    <TouchableOpacity
      style={styles.homeBtn}
      onPress={() => router.replace('/(app)')}
      activeOpacity={0.8}
    >
      <Text style={styles.homeBtnText}>{'\u2302'}</Text>
    </TouchableOpacity>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        {homeButton}
        <iframe
          src={PSYCORP_URL}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          title="PDQ RestoreCalc"
        />
      </View>
    );
  }

  const WebView = require('react-native-webview').default;
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {homeButton}
      <WebView
        source={{ uri: PSYCORP_URL }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  homeBtn: {
    position: 'absolute',
    top: 6,
    right: 12,
    zIndex: 200,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(26,58,92,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
