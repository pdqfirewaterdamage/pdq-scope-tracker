import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
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
  PDQ_BLUE,
} from '../../../constants/colors';

function getLastDayOfMonth(): string {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const yyyy = end.getFullYear();
  const mm = String(end.getMonth() + 1).padStart(2, '0');
  const dd = String(end.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function calcDaysRemaining(endDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDate + 'T12:00:00');
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const DEFAULTS = {
  active: true,
  prize1: '1000',
  prize2: '500',
  endDate: getLastDayOfMonth(),
};

export function PlaybookContest() {
  const [active, setActive] = useState(DEFAULTS.active);
  const [prize1, setPrize1] = useState(DEFAULTS.prize1);
  const [prize2, setPrize2] = useState(DEFAULTS.prize2);
  const [endDate, setEndDate] = useState(DEFAULTS.endDate);

  const daysLeft = calcDaysRemaining(endDate);

  const fmtPrize = (val: string) => {
    const n = parseInt(val, 10);
    if (isNaN(n)) return '$0';
    return '$' + n.toLocaleString();
  };

  const handleSave = () => {
    if (Platform.OS === 'web') {
      window.alert('Save coming soon');
    } else {
      Alert.alert('Save coming soon');
    }
  };

  const handleReset = () => {
    setActive(DEFAULTS.active);
    setPrize1(DEFAULTS.prize1);
    setPrize2(DEFAULTS.prize2);
    setEndDate(getLastDayOfMonth());
  };

  return (
    <View style={styles.container}>
      {/* Settings Section */}
      <Text style={styles.sectionHeader}>CONTEST SETTINGS</Text>
      <View style={styles.settingsCard}>
        {/* Active toggle */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Contest Active</Text>
          <Switch
            value={active}
            onValueChange={setActive}
            trackColor={{ false: '#334155', true: PDQ_ORANGE + '88' }}
            thumbColor={active ? PDQ_ORANGE : '#64748b'}
          />
        </View>

        <View style={styles.divider} />

        {/* Contest type */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Contest Type</Text>
          <Text style={styles.settingValue}>Closing Ratio Challenge</Text>
        </View>

        <View style={styles.divider} />

        {/* 1st place prize */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>1st Place Prize</Text>
          <View style={styles.inputRow}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={styles.prizeInput}
              value={prize1}
              onChangeText={setPrize1}
              keyboardType="numeric"
              placeholder="1000"
              placeholderTextColor={TEXT_DIM}
            />
          </View>
        </View>

        <View style={styles.divider} />

        {/* 2nd place prize */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>2nd Place Prize</Text>
          <View style={styles.inputRow}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={styles.prizeInput}
              value={prize2}
              onChangeText={setPrize2}
              keyboardType="numeric"
              placeholder="500"
              placeholderTextColor={TEXT_DIM}
            />
          </View>
        </View>

        <View style={styles.divider} />

        {/* End date */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>End Date</Text>
          <TextInput
            style={styles.dateInput}
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={TEXT_DIM}
            maxLength={10}
          />
        </View>
      </View>

      {/* Preview Section */}
      <Text style={styles.sectionHeader}>BANNER PREVIEW</Text>
      <View style={styles.previewCard}>
        <View style={styles.contestBox}>
          <View style={styles.contestGoldBar} />
          <Text style={styles.contestTrophy}>{'\uD83C\uDFC6'}</Text>
          <Text style={styles.contestTitle}>END OF MONTH CONTEST</Text>
          <Text style={styles.contestSub}>CLOSING RATIO CHALLENGE</Text>

          {/* 1st place */}
          <View style={styles.prizeRow1}>
            <Text style={styles.prizeEmoji}>{'\uD83E\uDD47'}</Text>
            <View style={styles.prizeMid}>
              <Text style={styles.prizeLabel}>1st Place</Text>
            </View>
            <Text style={styles.prizeAmount}>{fmtPrize(prize1)}</Text>
          </View>

          {/* 2nd place */}
          <View style={styles.prizeRow2}>
            <Text style={styles.prizeEmoji}>{'\uD83E\uDD48'}</Text>
            <View style={styles.prizeMid}>
              <Text style={styles.prize2Label}>2nd Place</Text>
            </View>
            <Text style={styles.prize2Amount}>{fmtPrize(prize2)}</Text>
          </View>

          {/* Days remaining */}
          <View style={styles.daysBox}>
            <Text style={styles.daysText}>
              {daysLeft} {daysLeft === 1 ? 'day' : 'days'} remaining
            </Text>
          </View>

          {!active && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeText}>CONTEST INACTIVE</Text>
            </View>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={handleReset}
          activeOpacity={0.8}
        >
          <Text style={styles.resetBtnText}>Reset to Defaults</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: TEXT_DIM,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
  },
  settingsCard: {
    backgroundColor: BG_CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 14,
    marginBottom: 18,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 40,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  settingValue: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: BORDER_COLOR,
    marginVertical: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dollarSign: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_MUTED,
    marginRight: 4,
  },
  prizeInput: {
    backgroundColor: BG_INPUT,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: '700',
    width: 90,
    textAlign: 'right',
  },
  dateInput: {
    backgroundColor: BG_INPUT,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: '700',
    width: 130,
    textAlign: 'right',
  },
  previewCard: {
    marginBottom: 18,
  },
  // Contest banner — matches kpi.tsx styling
  contestBox: {
    backgroundColor: '#1a0a00',
    borderWidth: 2,
    borderColor: PDQ_ORANGE,
    borderRadius: 14,
    padding: 16,
    overflow: 'hidden',
  },
  contestGoldBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#fbbf24',
  },
  contestTrophy: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 4,
  },
  contestTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fbbf24',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  contestSub: {
    fontSize: 11,
    color: PDQ_ORANGE,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  prizeRow1: {
    backgroundColor: '#78350f',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#fbbf2444',
    marginBottom: 8,
  },
  prizeEmoji: {
    fontSize: 28,
  },
  prizeMid: {
    flex: 1,
  },
  prizeLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fbbf24',
  },
  prizeAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fbbf24',
  },
  prizeRow2: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#94a3b833',
    marginBottom: 10,
  },
  prize2Label: {
    fontSize: 13,
    fontWeight: '800',
    color: '#e2e8f0',
  },
  prize2Amount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#94a3b8',
  },
  daysBox: {
    backgroundColor: '#fbbf2418',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fbbf2433',
  },
  daysText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fbbf24',
  },
  inactiveBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveBadgeText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ef4444',
    letterSpacing: 1.5,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: PDQ_BLUE,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  resetBtn: {
    flex: 1,
    backgroundColor: BG_CARD,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  resetBtnText: {
    color: TEXT_MUTED,
    fontSize: 14,
    fontWeight: '700',
  },
});
