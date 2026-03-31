import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import {
  BG_APP,
  BG_CARD,
  BORDER_COLOR,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  TEXT_DIM,
  PDQ_BLUE,
  PDQ_GREEN,
  PDQ_ORANGE,
  PDQ_RED,
} from '../../constants/colors';

interface IICRCPopupProps {
  visible: boolean;
  itemId: string;
  onClose: () => void;
}

interface ReferenceCard {
  title: string;
  standard: string;
  guidelines: string[];
  warnings?: string[];
}

const REFERENCE_DATA: Record<string, ReferenceCard> = {
  p1_dehumidifier: {
    title: 'Dehumidifier Placement',
    standard: 'IICRC S500 Section 12.4',
    guidelines: [
      '1 unit per 1,000 sqft of affected area',
      'Place centrally in affected zone',
      'Maintain 70-90\u00B0F operating temperature',
      'Monitor grain depression daily',
      'Exhaust warm air away from structure if possible',
      'Check condensate drainage every shift',
    ],
    warnings: [
      'Do not place directly on wet carpet',
      'Ensure adequate airflow around unit',
    ],
  },
  p1_air_scrubber: {
    title: 'Air Scrubber Placement',
    standard: 'IICRC S500 Section 12.5',
    guidelines: [
      '1 unit per 500 sqft for standard filtration',
      'HEPA filter required for Cat 3 jobs',
      'Create negative pressure in containment',
      'Exhaust outside the containment zone',
      'Replace pre-filters as needed',
      'Log filter changes in daily report',
    ],
    warnings: [
      'Never recirculate Cat 3 air into clean zones',
    ],
  },
  p1_hydroxyl: {
    title: 'Hydroxyl Generator',
    standard: 'IICRC S500 Section 12.6',
    guidelines: [
      'Required for all Category 3 losses',
      '1 unit per 1,000 sqft of affected area',
      'Safe for occupied spaces — no evacuation needed',
      'Operates 24/7 during drying process',
      'Position for maximum air circulation',
      'Effective for odor neutralization',
    ],
    warnings: [
      'Mandatory for Cat 3 — cannot be marked N/A',
      'Verify unit is operational each shift',
    ],
  },
  p3_air_mover: {
    title: 'Air Mover Placement',
    standard: 'IICRC S500 Section 12.3',
    guidelines: [
      '1 unit per 50 sqft of wet flooring',
      'Angle at 15-30\u00B0 against walls for drying',
      'Create circular airflow pattern in room',
      'Stack if needed for wall/ceiling drying',
      'Monitor daily — reposition as drying progresses',
      'Log equipment count and placement',
    ],
  },
  p3_dehumidifier_check: {
    title: 'Dehumidifier Monitoring',
    standard: 'IICRC S500 Section 12.4.3',
    guidelines: [
      'Record grain depression readings 2x daily',
      'Target: maintain below 55 grains per pound',
      'Check condensate pump and drainage',
      'Verify operating temperature range',
      'Note any error codes or alarms',
      'Adjust placement based on drying progress',
    ],
  },
  p3_moisture_readings: {
    title: 'Moisture Monitoring',
    standard: 'IICRC S500 Section 11',
    guidelines: [
      'Take readings minimum 2x daily (AM/PM)',
      'Use pin-type meter for wood, invasive materials',
      'Use non-invasive meter for drywall, concrete',
      'Document all readings with photos',
      'Compare to dry standard (unaffected area)',
      'Drying goal: within 2% of dry standard',
      'Map moisture readings on floor plan',
    ],
    warnings: [
      'Photo required with each reading set',
      'Never rely on a single measurement point',
    ],
  },
  p1_neg_air: {
    title: 'Negative Air Machine',
    standard: 'IICRC S500 Section 12.5',
    guidelines: [
      'Required for containment zones',
      'HEPA filtration mandatory for Cat 3',
      'Exhaust outside the building or containment',
      'Maintain negative pressure differential',
      'Verify seal at containment barriers',
      'Log runtime and filter condition daily',
    ],
  },
  gen_ppe: {
    title: 'PPE Requirements',
    standard: 'OSHA 29 CFR 1910.134',
    guidelines: [
      'Cat 2: Gloves, eye protection, N95 minimum',
      'Cat 3: Full-face respirator, Tyvek suit, rubber boots',
      'Fire/Smoke: P100 respirator, fire-rated PPE',
      'Always: Steel-toe boots on demolition sites',
      'Inspect PPE before each use',
      'Replace damaged PPE immediately',
    ],
    warnings: [
      'Cat 3 PPE is mandatory — no exceptions',
      'Document PPE usage in daily report',
    ],
  },
};

export function IICRCPopup({ visible, itemId, onClose }: IICRCPopupProps) {
  const card = REFERENCE_DATA[itemId];

  if (!card) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{card.title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.standardBadge}>
            <Text style={styles.standardText}>{card.standard}</Text>
          </View>

          <Text style={styles.sectionTitle}>Guidelines</Text>
          {card.guidelines.map((g, i) => (
            <View key={i} style={styles.guidelineRow}>
              <Text style={styles.bullet}>{'\u2022'}</Text>
              <Text style={styles.guidelineText}>{g}</Text>
            </View>
          ))}

          {card.warnings && card.warnings.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: PDQ_RED }]}>
                {'\u26A0'} Warnings
              </Text>
              {card.warnings.map((w, i) => (
                <View key={i} style={styles.warningRow}>
                  <Text style={styles.warningText}>{w}</Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

export function hasReferenceCard(scopeItemId: string): boolean {
  return scopeItemId in REFERENCE_DATA;
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    backgroundColor: BG_CARD,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  closeBtn: {
    color: PDQ_ORANGE,
    fontSize: 15,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  standardBadge: {
    backgroundColor: '#0d2818',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1a4d2e',
  },
  standardText: {
    color: PDQ_GREEN,
    fontWeight: '700',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 10,
    marginTop: 8,
  },
  guidelineRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    paddingRight: 16,
  },
  bullet: {
    color: PDQ_BLUE,
    fontSize: 14,
    fontWeight: '700',
  },
  guidelineText: {
    color: TEXT_SECONDARY,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  warningRow: {
    backgroundColor: '#ef44441a',
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: PDQ_RED,
  },
  warningText: {
    color: PDQ_RED,
    fontSize: 13,
    fontWeight: '600',
  },
});
