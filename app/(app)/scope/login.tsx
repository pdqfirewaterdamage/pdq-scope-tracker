import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { TECHS } from '../../../constants/techs';
import {
  BG_APP,
  BG_CARD,
  BORDER_COLOR,
  TEXT_PRIMARY,
  TEXT_DIM,
  PDQ_ORANGE,
  PDQ_BLUE,
  PDQ_RED,
} from '../../../constants/colors';

export default function TechLoginScreen() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const tryLogin = () => {
    const code = input.trim().toUpperCase();
    const tech = TECHS.find((t) => t.code === code);
    if (tech) {
      router.push({ pathname: '/(app)/scope/kpi', params: { techId: tech.id } });
    } else {
      setError('Code not recognized. Try CB, JK, LT, or DP.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoWrap}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>PDQ</Text>
        </View>
        <Text style={styles.appTitle}>Daily Scope Tracker</Text>
        <Text style={styles.appSubtitle}>PDQ Restoration</Text>
      </View>

      {/* Login card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>ENTER YOUR TECH CODE</Text>

        <TextInput
          style={[
            styles.codeInput,
            error ? { borderColor: PDQ_RED } : input ? { borderColor: PDQ_BLUE } : {},
          ]}
          value={input}
          onChangeText={(t) => {
            setInput(t.toUpperCase().slice(0, 2));
            setError('');
          }}
          onSubmitEditing={tryLogin}
          placeholder="00"
          placeholderTextColor="#334155"
          maxLength={2}
          autoCapitalize="characters"
          autoCorrect={false}
          autoFocus
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.signInBtn, !input && { opacity: 0.5 }]}
          onPress={tryLogin}
          disabled={!input}
          activeOpacity={0.8}
        >
          <Text style={styles.signInText}>Sign In {'\u2192'}</Text>
        </TouchableOpacity>

        {/* Tech grid */}
        <View style={styles.techGrid}>
          {TECHS.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[
                styles.techCard,
                input === t.code && { borderColor: PDQ_BLUE, backgroundColor: PDQ_BLUE + '15' },
              ]}
              onPress={() => {
                setInput(t.code);
                setError('');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.techAvatar}>{t.avatar}</Text>
              <Text
                style={[
                  styles.techName,
                  input === t.code && { color: '#60a5fa' },
                ]}
              >
                {t.name}
              </Text>
              <Text style={styles.techCode}>{t.code}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_APP,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBox: {
    width: 80,
    height: 80,
    backgroundColor: PDQ_ORANGE,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: 1,
  },
  appSubtitle: {
    fontSize: 13,
    color: '#60a5fa',
    marginTop: 4,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: BG_CARD,
    borderRadius: 16,
    padding: 28,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 20,
  },
  codeInput: {
    width: '100%',
    textAlign: 'center',
    fontSize: 52,
    fontWeight: '900',
    backgroundColor: '#0a1628',
    borderWidth: 2,
    borderColor: BORDER_COLOR,
    color: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    letterSpacing: 8,
  },
  errorText: {
    color: PDQ_RED,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  signInBtn: {
    width: '100%',
    marginTop: 16,
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: PDQ_BLUE,
    alignItems: 'center',
  },
  signInText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  techGrid: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  techCard: {
    width: '48%',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  techAvatar: {
    fontSize: 18,
  },
  techName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2,
  },
  techCode: {
    fontSize: 12,
    color: PDQ_BLUE,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
