import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppContext } from '../../context/AppContext';
import {
  BG_APP,
  BG_CARD,
  BG_HEADER,
  BORDER_COLOR,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_DIM,
  PDQ_NAVY,
  PDQ_ORANGE,
  PDQ_GREEN,
  PDQ_GREEN_LIGHT,
  PDQ_BLUE,
  PDQ_PURPLE,
  PDQ_RED,
} from '../../constants/colors';

interface AppTile {
  key: string;
  label: string;
  icon: string;
  color: string;
  route: string | null;
  enabled: boolean;
}

const APP_TILES: AppTile[] = [
  {
    key: 'scope',
    label: 'Scope Tracker',
    icon: '\uD83D\uDCCB',
    color: PDQ_NAVY,
    route: '/(app)/scope',
    enabled: true,
  },
  {
    key: 'psycorp',
    label: 'Psycorp',
    icon: '\uD83E\uDDEE',
    color: PDQ_GREEN_LIGHT,
    route: '/(app)/psycorp',
    enabled: true,
  },
  {
    key: 'slot3',
    label: 'Coming Soon',
    icon: '\uD83D\uDD12',
    color: '#475569',
    route: null,
    enabled: false,
  },
  {
    key: 'slot4',
    label: 'Coming Soon',
    icon: '\uD83D\uDD12',
    color: '#475569',
    route: null,
    enabled: false,
  },
  {
    key: 'slot5',
    label: 'Coming Soon',
    icon: '\uD83D\uDD12',
    color: '#475569',
    route: null,
    enabled: false,
  },
  {
    key: 'slot6',
    label: 'Coming Soon',
    icon: '\uD83D\uDD12',
    color: '#475569',
    route: null,
    enabled: false,
  },
];

export default function HubScreen() {
  const router = useRouter();
  const { signOut, profile } = useAppContext();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>PDQ</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>PDQ Restoration</Text>
            <Text style={styles.headerSubtitle}>
              {profile?.full_name ?? 'Welcome'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* App Grid */}
        <View style={styles.grid}>
          {APP_TILES.map((tile) => (
            <TouchableOpacity
              key={tile.key}
              style={[
                styles.tile,
                !tile.enabled && styles.tileDisabled,
              ]}
              onPress={() => {
                if (tile.enabled && tile.route) {
                  router.push(tile.route as any);
                }
              }}
              disabled={!tile.enabled}
              activeOpacity={0.7}
            >
              <View style={[styles.tileIcon, { backgroundColor: tile.color + '1a' }]}>
                <Text style={styles.tileEmoji}>{tile.icon}</Text>
              </View>
              <Text style={[styles.tileLabel, !tile.enabled && styles.tileLabelDisabled]}>
                {tile.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>PDQ Restoration</Text>
          <Text style={styles.footerSub}>973-316-6014 | pdqfirewaterdamage.com</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_APP,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: BG_HEADER,
    borderBottomWidth: 2,
    borderBottomColor: PDQ_GREEN,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    backgroundColor: PDQ_GREEN,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  headerSubtitle: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  signOutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 6,
  },
  signOutText: {
    color: TEXT_MUTED,
    fontSize: 14,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  tile: {
    width: '47%',
    backgroundColor: BG_CARD,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    marginBottom: 4,
  },
  tileDisabled: {
    opacity: 0.4,
  },
  tileIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tileEmoji: {
    fontSize: 30,
  },
  tileLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  tileLabelDisabled: {
    color: TEXT_DIM,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    paddingBottom: 20,
  },
  footerText: {
    color: TEXT_DIM,
    fontSize: 13,
    fontWeight: '600',
  },
  footerSub: {
    color: TEXT_DIM,
    fontSize: 11,
    marginTop: 4,
  },
});
