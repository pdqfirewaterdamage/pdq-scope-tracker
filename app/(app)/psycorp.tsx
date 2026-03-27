import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BG_APP } from '../../constants/colors';

const PSYCORP_URL = 'https://pdqfirewaterdamage.github.io/pdq-sycorp-calculator/';

export default function PsycorpScreen() {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <iframe
          src={PSYCORP_URL}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          title="Psycorp Calculator"
        />
      </View>
    );
  }

  // Native: use WebView
  const WebView = require('react-native-webview').default;
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: PSYCORP_URL }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_APP,
  },
  webview: {
    flex: 1,
  },
});
