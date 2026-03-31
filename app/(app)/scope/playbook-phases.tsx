import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import {
  BG_APP,
  BG_CARD,
  BG_INPUT,
  BORDER_COLOR,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  TEXT_DIM,
  PDQ_ORANGE,
  PDQ_GREEN,
  PDQ_BLUE,
  PDQ_RED,
  PDQ_PURPLE,
  PDQ_AMBER,
  PDQ_GRAY,
} from '../../../constants/colors';
import { SCOPE_TEMPLATE, ScopeSection, ScopeItem } from '../../../constants/templates';

// ─── Phase metadata ─────────────────────────────────────────────────────────

interface PhaseInfo {
  key: string;
  label: string;
  color: string;
}

const PHASE_MAP: Record<string, PhaseInfo> = {
  '1': { key: '1', label: 'Phase 1 -- Emergency Services', color: PDQ_BLUE },
  '3': { key: '3', label: 'Phase 3 -- Demo, Cleaning, Dryout', color: PDQ_GREEN },
  general: { key: 'general', label: 'General', color: PDQ_ORANGE },
  fire: { key: 'fire', label: 'Fire / Smoke Restoration', color: PDQ_RED },
  recon: { key: 'recon', label: 'Reconstruction', color: PDQ_PURPLE },
};

// ─── Input type badge colors ────────────────────────────────────────────────

const INPUT_TYPE_COLORS: Record<string, string> = {
  pct: PDQ_BLUE,
  qty: PDQ_GREEN,
  lf: PDQ_AMBER,
  sf: PDQ_ORANGE,
  drop: PDQ_PURPLE,
};

// ─── Toast helper ───────────────────────────────────────────────────────────

function showComingSoon() {
  if (Platform.OS === 'web') {
    // Simple toast-like alert on web
    Alert.alert('Coming Soon', 'Save changes coming soon');
  } else {
    Alert.alert('Coming Soon', 'Save changes coming soon');
  }
}

// ─── Item Row ───────────────────────────────────────────────────────────────

function ItemRow({ item }: { item: ScopeItem }) {
  return (
    <View style={styles.itemRow}>
      <View style={styles.itemMain}>
        <TouchableOpacity
          style={styles.itemLabelWrap}
          onPress={showComingSoon}
          activeOpacity={0.7}
        >
          <Text style={styles.itemLabel} numberOfLines={2}>
            {item.label}
          </Text>
        </TouchableOpacity>

        <View style={styles.itemBadges}>
          {/* Input type badge */}
          {item.inputType ? (
            <View
              style={[
                styles.badge,
                { backgroundColor: (INPUT_TYPE_COLORS[item.inputType] || PDQ_GRAY) + '33' },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: INPUT_TYPE_COLORS[item.inputType] || PDQ_GRAY },
                ]}
              >
                {item.inputType.toUpperCase()}
              </Text>
            </View>
          ) : null}

          {/* Photo required toggle */}
          <TouchableOpacity
            style={[
              styles.toggleBadge,
              item.requirePhoto ? styles.toggleOn : styles.toggleOff,
            ]}
            onPress={showComingSoon}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.toggleBadgeText,
                { color: item.requirePhoto ? '#fff' : TEXT_DIM },
              ]}
            >
              Photo
            </Text>
          </TouchableOpacity>

          {/* noHours toggle */}
          <TouchableOpacity
            style={[
              styles.toggleBadge,
              item.noHours ? styles.toggleOn : styles.toggleOff,
            ]}
            onPress={showComingSoon}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.toggleBadgeText,
                { color: item.noHours ? '#fff' : TEXT_DIM },
              ]}
            >
              noHrs
            </Text>
          </TouchableOpacity>

          {/* mandatory toggle */}
          <TouchableOpacity
            style={[
              styles.toggleBadge,
              item.mandatory
                ? { backgroundColor: PDQ_RED + 'cc' }
                : styles.toggleOff,
            ]}
            onPress={showComingSoon}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.toggleBadgeText,
                { color: item.mandatory ? '#fff' : TEXT_DIM },
              ]}
            >
              Req
            </Text>
          </TouchableOpacity>

          {/* Delete button */}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={showComingSoon}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteBtnText}>X</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Subsection Block ───────────────────────────────────────────────────────

function SubsectionBlock({ section }: { section: ScopeSection }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={styles.subsectionBlock}>
      <TouchableOpacity
        style={styles.subsectionHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.chevron}>{expanded ? '\u25BC' : '\u25B6'}</Text>
        <Text style={styles.subsectionLabel}>{section.label}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{section.items.length}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.subsectionContent}>
          {section.items.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}

          {/* Add Item button */}
          <TouchableOpacity
            style={styles.addBtn}
            onPress={showComingSoon}
            activeOpacity={0.7}
          >
            <Text style={styles.addBtnText}>+ Add Item</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Phase Group ────────────────────────────────────────────────────────────

function PhaseGroup({
  phaseKey,
  sections,
}: {
  phaseKey: string;
  sections: ScopeSection[];
}) {
  const [expanded, setExpanded] = useState(false);
  const info = PHASE_MAP[phaseKey] || {
    key: phaseKey,
    label: phaseKey,
    color: PDQ_GRAY,
  };
  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <View style={styles.phaseGroup}>
      <TouchableOpacity
        style={[styles.phaseHeader, { borderLeftColor: info.color }]}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.phaseChevron}>{expanded ? '\u25BC' : '\u25B6'}</Text>
        <View style={styles.phaseHeaderTextWrap}>
          <Text style={styles.phaseLabel}>{info.label}</Text>
          <Text style={styles.phaseMeta}>
            {sections.length} subsection{sections.length !== 1 ? 's' : ''} /{' '}
            {totalItems} item{totalItems !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={[styles.phaseCountBadge, { backgroundColor: info.color + '33' }]}>
          <Text style={[styles.phaseCountText, { color: info.color }]}>{totalItems}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.phaseContent}>
          {sections.map((section) => (
            <SubsectionBlock key={section.id} section={section} />
          ))}

          {/* Add Subsection button */}
          <TouchableOpacity
            style={styles.addSubsectionBtn}
            onPress={showComingSoon}
            activeOpacity={0.7}
          >
            <Text style={styles.addSubsectionBtnText}>+ Add Subsection</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function PlaybookPhases() {
  // Group sections by phase
  const grouped = useMemo(() => {
    const map: Record<string, ScopeSection[]> = {};
    const order: string[] = [];

    for (const section of SCOPE_TEMPLATE) {
      if (!map[section.phase]) {
        map[section.phase] = [];
        order.push(section.phase);
      }
      map[section.phase].push(section);
    }

    return order.map((key) => ({ key, sections: map[key] }));
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={styles.title}>Scope Phases</Text>
      <Text style={styles.subtitle}>
        View and manage workflow phases, subsections, and scope items.
      </Text>

      {grouped.map(({ key, sections }) => (
        <PhaseGroup key={key} phaseKey={key} sections={sections} />
      ))}
    </ScrollView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_APP,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginBottom: 20,
  },

  // Phase group
  phaseGroup: {
    marginBottom: 12,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: BG_CARD,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderLeftWidth: 4,
  },
  phaseChevron: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginRight: 10,
    width: 16,
  },
  phaseHeaderTextWrap: {
    flex: 1,
  },
  phaseLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  phaseMeta: {
    fontSize: 11,
    color: TEXT_DIM,
    marginTop: 2,
  },
  phaseCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
  },
  phaseCountText: {
    fontSize: 13,
    fontWeight: '700',
  },
  phaseContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },

  // Subsection
  subsectionBlock: {
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: BG_INPUT,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    overflow: 'hidden',
  },
  subsectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chevron: {
    fontSize: 10,
    color: TEXT_DIM,
    marginRight: 8,
    width: 14,
  },
  subsectionLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_SECONDARY,
  },
  countBadge: {
    backgroundColor: BORDER_COLOR,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_MUTED,
  },
  subsectionContent: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },

  // Item row
  itemRow: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    paddingVertical: 8,
  },
  itemMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemLabelWrap: {
    flex: 1,
    minWidth: 0,
  },
  itemLabel: {
    fontSize: 13,
    color: TEXT_SECONDARY,
  },
  itemBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },

  // Badges
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  toggleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  toggleOn: {
    backgroundColor: PDQ_GREEN + 'cc',
    borderColor: PDQ_GREEN,
  },
  toggleOff: {
    backgroundColor: 'transparent',
    borderColor: BORDER_COLOR,
  },
  toggleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },

  // Delete
  deleteBtn: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: PDQ_RED + '22',
    borderWidth: 1,
    borderColor: PDQ_RED + '55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: PDQ_RED,
    fontSize: 11,
    fontWeight: '700',
  },

  // Add buttons
  addBtn: {
    marginTop: 8,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addBtnText: {
    color: TEXT_DIM,
    fontSize: 12,
    fontWeight: '600',
  },
  addSubsectionBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PDQ_ORANGE + '55',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addSubsectionBtnText: {
    color: PDQ_ORANGE,
    fontSize: 13,
    fontWeight: '600',
  },
});
