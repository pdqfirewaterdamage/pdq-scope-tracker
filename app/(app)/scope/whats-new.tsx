import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import {
  BG_APP,
  BG_CARD,
  BORDER_COLOR,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_DIM,
  PDQ_ORANGE,
} from '../../../constants/colors';

interface Release {
  version: string;
  date: string;
  items: string[];
}

const CHANGELOG: Release[] = [
  {
    version: 'v1.6',
    date: 'March 31, 2026',
    items: [
      'Playbook admin panel (enter code "AD" on login screen)',
      'Techs tab: view, edit, add, and delete technicians with KPI stats',
      'Rooms tab: toggle room presets on/off, reorder with arrows, add custom rooms',
      'Placeholder tabs for Phases, Prices, and Contest (coming soon)',
    ],
  },
  {
    version: 'v1.5',
    date: 'March 31, 2026',
    items: [
      'Tech login with 2-letter codes (CB/JK/LT/DP)',
      'KPI dashboard with closing ratio, avg job size, team leaderboard',
      'End-of-month contest banner ($1,000 / $500 prizes)',
      'Weekend auto after-hours detection',
      'Room carry-forward from previous sheets',
      'Add Day (backdate missed sheets)',
      'Room measurements panel with IICRC S500 calculator',
      'Auto-fill quantities from room dimensions',
      'Input type rendering (pct/qty/lf/sf/drop)',
      'Photo required indicators on specific items',
      'IICRC/OSHA popup reference cards for equipment',
      '6-tab Complete Job Package report',
      'Xactimate billing format with PDQ letterhead',
      'General Daily section with PPE, moisture, cleanup',
      'Additional Techs question (blocks submit until answered)',
      'Estimator view with project summary and daily breakdown',
      'Project card actions (Estimator Review, Mark Complete, View Report)',
      'Mold Protocol sentinel UI',
      'Export/Import backup',
      'Scroll-to-pending badges',
      'Fire & Smoke + Reconstruction scope templates',
      'Date pill tabs for sheet switching',
    ],
  },
  {
    version: 'v1.0',
    date: 'March 26, 2026',
    items: [
      'Initial release',
      'Project creation with Water Mitigation / Fire & Smoke / General types',
      'Daily scope sheets with room-by-room checklists',
      'Contents section (Phase 2)',
      'Walls, ceiling, flooring demo sections',
      'Asbestos testing section',
      'PDF export',
      'Supabase backend',
    ],
  },
];

export default function WhatsNewScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>What's New</Text>

        {CHANGELOG.map((release) => (
          <View key={release.version} style={styles.releaseCard}>
            <Text style={styles.versionHeader}>
              {release.version} — {release.date}
            </Text>
            {release.items.map((item, idx) => (
              <Text key={idx} style={styles.bulletItem}>
                {'\u2022'} {item}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_APP,
  },
  content: {
    padding: 16,
    paddingBottom: 60,
  },
  header: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: 20,
  },
  releaseCard: {
    backgroundColor: BG_CARD,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 16,
    marginBottom: 16,
  },
  versionHeader: {
    fontSize: 17,
    fontWeight: '800',
    color: PDQ_ORANGE,
    marginBottom: 12,
  },
  bulletItem: {
    fontSize: 14,
    color: TEXT_PRIMARY,
    lineHeight: 22,
    paddingLeft: 4,
  },
});
