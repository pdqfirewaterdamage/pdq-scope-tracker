import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
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

// ─── Default XPC keyword prices (NE Region) ────────────────────────────────

const DEFAULT_XPC: Record<string, number> = {
  extraction: 0.38,
  antimicrobial: 0.41,
  dehumidifier: 75.75,
  'air mover': 32.50,
  'air scrubber': 79.00,
  hydroxyl: 125.00,
  drywall: 1.41,
  'carpet pad': 0.22,
  carpet: 0.45,
  tile: 2.45,
  vinyl: 0.68,
  hardwood: 1.95,
  baseboard: 0.85,
  insulation: 1.03,
  stud: 1.27,
  hepa: 0.51,
  'mold remediation': 8.50,
  encapsulant: 1.85,
  asbestos: 385.00,
  monitoring: 55.00,
  moisture: 75.00,
};

// ─── Category definitions ───────────────────────────────────────────────────

interface PriceCategory {
  key: string;
  label: string;
  icon: string;
  color: string;
  items: string[]; // keys into XPC
}

const CATEGORIES: PriceCategory[] = [
  {
    key: 'extraction',
    label: 'Extraction & Treatment',
    icon: '\uD83D\uDCA7', // droplet
    color: PDQ_BLUE,
    items: ['extraction', 'antimicrobial'],
  },
  {
    key: 'equipment',
    label: 'Equipment',
    icon: '\u2699\uFE0F', // gear
    color: PDQ_ORANGE,
    items: ['dehumidifier', 'air mover', 'air scrubber', 'hydroxyl'],
  },
  {
    key: 'demolition',
    label: 'Demolition',
    icon: '\uD83D\uDD28', // hammer
    color: PDQ_RED,
    items: ['drywall', 'insulation', 'baseboard'],
  },
  {
    key: 'flooring',
    label: 'Flooring',
    icon: '\uD83C\uDFE0', // house
    color: PDQ_GREEN,
    items: ['carpet', 'carpet pad', 'tile', 'vinyl', 'hardwood'],
  },
  {
    key: 'cleaning',
    label: 'Cleaning',
    icon: '\uD83E\uDDF9', // broom
    color: PDQ_PURPLE,
    items: ['hepa', 'stud', 'encapsulant', 'mold remediation'],
  },
  {
    key: 'testing',
    label: 'Testing & Monitoring',
    icon: '\uD83D\uDD2C', // microscope
    color: PDQ_AMBER,
    items: ['asbestos', 'monitoring', 'moisture'],
  },
];

// ─── Unit type lookup ───────────────────────────────────────────────────────

const UNIT_MAP: Record<string, string> = {
  extraction: 'SF',
  antimicrobial: 'SF',
  dehumidifier: 'EA/DAY',
  'air mover': 'EA/DAY',
  'air scrubber': 'EA/DAY',
  hydroxyl: 'EA/DAY',
  drywall: 'SF',
  insulation: 'SF',
  baseboard: 'LF',
  carpet: 'SF',
  'carpet pad': 'SF',
  tile: 'SF',
  vinyl: 'SF',
  hardwood: 'SF',
  stud: 'SF',
  hepa: 'SF',
  'mold remediation': 'SF',
  encapsulant: 'SF',
  asbestos: 'EA',
  monitoring: 'EA',
  moisture: 'EA',
};

// ─── Description lookup ─────────────────────────────────────────────────────

const DESCRIPTION_MAP: Record<string, string> = {
  extraction: 'Extraction',
  antimicrobial: 'Antimicrobial Application',
  dehumidifier: 'Dehumidifier (per 24hr)',
  'air mover': 'Air Mover (per 24hr)',
  'air scrubber': 'Air Scrubber (per 24hr)',
  hydroxyl: 'Hydroxyl Generator (per 24hr)',
  drywall: 'Drywall Removal',
  insulation: 'Insulation Removal',
  baseboard: 'Baseboard Removal',
  carpet: 'Carpet Removal',
  'carpet pad': 'Carpet Pad Removal',
  tile: 'Tile Removal',
  vinyl: 'Vinyl Removal',
  hardwood: 'Hardwood Removal',
  stud: 'Stud Cleaning',
  hepa: 'HEPA Vacuum',
  'mold remediation': 'Mold Remediation',
  encapsulant: 'Encapsulant Application',
  asbestos: 'Asbestos Testing',
  monitoring: 'Daily Monitoring',
  moisture: 'Moisture Reading',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt$(n: number): string {
  return '$' + Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function showComingSoon() {
  Alert.alert('Coming Soon', 'Save changes coming soon');
}

// ─── Price Row ──────────────────────────────────────────────────────────────

function PriceRow({
  keyword,
  price,
  onChangePrice,
}: {
  keyword: string;
  price: number;
  onChangePrice: (keyword: string, value: string) => void;
}) {
  const desc = DESCRIPTION_MAP[keyword] || keyword;
  const unit = UNIT_MAP[keyword] || 'EA';

  return (
    <View style={styles.priceRow}>
      <View style={styles.priceInfo}>
        <Text style={styles.priceKeyword}>{desc}</Text>
        <View style={styles.priceMetaRow}>
          <View style={styles.unitBadge}>
            <Text style={styles.unitBadgeText}>{unit}</Text>
          </View>
          <Text style={styles.priceKeywordDim}>{keyword}</Text>
        </View>
      </View>
      <View style={styles.priceInputWrap}>
        <Text style={styles.dollarSign}>$</Text>
        <TextInput
          style={styles.priceInput}
          value={price.toString()}
          onChangeText={(val) => onChangePrice(keyword, val)}
          keyboardType="decimal-pad"
          selectTextOnFocus
          placeholderTextColor={TEXT_DIM}
        />
      </View>
    </View>
  );
}

// ─── Category Card ──────────────────────────────────────────────────────────

function CategoryCard({
  category,
  prices,
  onChangePrice,
}: {
  category: PriceCategory;
  prices: Record<string, number>;
  onChangePrice: (keyword: string, value: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const categoryTotal = category.items.reduce(
    (sum, key) => sum + (prices[key] || 0),
    0
  );

  return (
    <View style={styles.categoryCard}>
      <TouchableOpacity
        style={[styles.categoryHeader, { borderLeftColor: category.color }]}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.categoryIcon}>{category.icon}</Text>
        <View style={styles.categoryHeaderText}>
          <Text style={styles.categoryLabel}>{category.label}</Text>
          <Text style={styles.categoryMeta}>
            {category.items.length} item{category.items.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.categoryTotalWrap}>
          <Text style={[styles.categoryTotal, { color: category.color }]}>
            {fmt$(categoryTotal)}
          </Text>
          <Text style={styles.chevron}>{expanded ? '\u25BC' : '\u25B6'}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.categoryContent}>
          {category.items.map((keyword) => (
            <PriceRow
              key={keyword}
              keyword={keyword}
              price={prices[keyword] || 0}
              onChangePrice={onChangePrice}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function PlaybookPrices() {
  const [prices, setPrices] = useState<Record<string, number>>({ ...DEFAULT_XPC });

  const handleChangePrice = useCallback((keyword: string, value: string) => {
    const parsed = parseFloat(value);
    setPrices((prev) => ({
      ...prev,
      [keyword]: isNaN(parsed) ? 0 : parsed,
    }));
    // Future: debounce + persist
  }, []);

  const handleResetDefaults = useCallback(() => {
    Alert.alert(
      'Reset Prices',
      'Reset all prices to default Xactimate NE Region values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => setPrices({ ...DEFAULT_XPC }),
        },
      ]
    );
  }, []);

  const handleSave = useCallback(() => {
    showComingSoon();
  }, []);

  // Grand total across all categories
  const grandTotal = Object.values(prices).reduce((sum, p) => sum + p, 0);

  // Count how many prices differ from defaults
  const changedCount = Object.keys(DEFAULT_XPC).filter(
    (k) => prices[k] !== DEFAULT_XPC[k]
  ).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={styles.title}>Xactimate Prices</Text>
      <Text style={styles.subtitle}>
        NE Region unit prices used for billing and Xactimate report generation.
      </Text>

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{Object.keys(DEFAULT_XPC).length}</Text>
          <Text style={styles.summaryLabel}>Items</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{CATEGORIES.length}</Text>
          <Text style={styles.summaryLabel}>Categories</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: PDQ_GREEN }]}>
            {fmt$(grandTotal)}
          </Text>
          <Text style={styles.summaryLabel}>Sum Total</Text>
        </View>
        {changedCount > 0 && (
          <>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: PDQ_AMBER }]}>
                {changedCount}
              </Text>
              <Text style={styles.summaryLabel}>Modified</Text>
            </View>
          </>
        )}
      </View>

      {/* Category cards */}
      {CATEGORIES.map((cat) => (
        <CategoryCard
          key={cat.key}
          category={cat}
          prices={prices}
          onChangePrice={handleChangePrice}
        />
      ))}

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={handleResetDefaults}
          activeOpacity={0.7}
        >
          <Text style={styles.resetBtnText}>Reset to Defaults</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.7}
        >
          <Text style={styles.saveBtnText}>Save Prices</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 16,
  },

  // Summary bar
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG_CARD,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 12,
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  summaryLabel: {
    fontSize: 10,
    color: TEXT_DIM,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: BORDER_COLOR,
  },

  // Category card
  categoryCard: {
    marginBottom: 12,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: BG_CARD,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderLeftWidth: 4,
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  categoryHeaderText: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  categoryMeta: {
    fontSize: 11,
    color: TEXT_DIM,
    marginTop: 2,
  },
  categoryTotalWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryTotal: {
    fontSize: 14,
    fontWeight: '700',
  },
  chevron: {
    fontSize: 10,
    color: TEXT_DIM,
    width: 14,
  },
  categoryContent: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },

  // Price row
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  priceInfo: {
    flex: 1,
    marginRight: 12,
  },
  priceKeyword: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_SECONDARY,
  },
  priceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 6,
  },
  unitBadge: {
    backgroundColor: BORDER_COLOR,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  unitBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: TEXT_MUTED,
    letterSpacing: 0.5,
  },
  priceKeywordDim: {
    fontSize: 11,
    color: TEXT_DIM,
    fontStyle: 'italic',
  },
  priceInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG_INPUT,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    paddingHorizontal: 10,
    minWidth: 100,
  },
  dollarSign: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_DIM,
    marginRight: 2,
  },
  priceInput: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    paddingVertical: 8,
    minWidth: 60,
    textAlign: 'right',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PDQ_RED + '55',
    backgroundColor: PDQ_RED + '11',
    alignItems: 'center',
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: PDQ_RED,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: PDQ_GREEN,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
