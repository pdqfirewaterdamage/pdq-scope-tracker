import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TECHS, Tech } from '../../../constants/techs';
import {
  BG_APP,
  BG_CARD,
  BORDER_COLOR,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_DIM,
  PDQ_ORANGE,
  PDQ_BLUE,
  PDQ_GREEN,
  PDQ_RED,
} from '../../../constants/colors';

export default function KPIScreen() {
  const { techId } = useLocalSearchParams<{ techId: string }>();
  const router = useRouter();
  const tech = TECHS.find((t) => t.id === techId) ?? TECHS[0];

  const [expanded, setExpanded] = useState<'ratio' | 'size' | null>('ratio');

  const leaderboard = [...TECHS].sort((a, b) => b.closingRatio - a.closingRatio);
  const myRank = leaderboard.findIndex((t) => t.id === tech.id) + 1;
  const rankEmojis = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49', '4\uFE0F\u20E3'];

  const sizeLeaderboard = [...TECHS].sort((a, b) => b.avgJobSize - a.avgJobSize);
  const sizeRank = sizeLeaderboard.findIndex((t) => t.id === tech.id) + 1;

  const daysLeft = (() => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return end.getDate() - now.getDate();
  })();

  const ratioMsg = [
    { rank: 1, color: PDQ_ORANGE, msg: '\uD83D\uDD25 You\'re the closer on this team. Stay hungry \u2014 the team is right behind you.' },
    { rank: 2, color: '#f59e0b', msg: `\uD83D\uDCAA You're ${leaderboard[0].closingRatio - tech.closingRatio}% behind ${leaderboard[0].name}. One more close and you're there.` },
    { rank: 3, color: '#60a5fa', msg: `\uD83D\uDCC8 Push past ${leaderboard[1].name} \u2014 you're only ${leaderboard[1].closingRatio - tech.closingRatio}% behind #2.` },
    { rank: 4, color: PDQ_RED, msg: '\uD83D\uDE80 You\'re at the bottom right now. Every job is a chance to climb. Let\'s go.' },
  ];
  const myRatioMsg = ratioMsg.find((m) => m.rank === myRank) ?? ratioMsg[3];

  const topSize = Math.max(...TECHS.map((t) => t.avgJobSize));
  const sizeDiff = topSize - tech.avgJobSize;
  const sizeMsg = [
    { rank: 1, color: PDQ_GREEN, msg: `\uD83D\uDCB0 Highest average on the team at $${tech.avgJobSize.toLocaleString()}. You know how to scope a job right.` },
    { rank: 2, color: '#60a5fa', msg: `\uD83D\uDCCA $${sizeDiff.toLocaleString()} away from the top average. Look for upsell opportunities on every job.` },
    { rank: 3, color: '#f59e0b', msg: '\uD83D\uDCA1 Your scopes are coming in under average. Don\'t leave items on the table \u2014 document everything.' },
    { rank: 4, color: PDQ_RED, msg: '\u26A1 Lowest average on the team. Use the full scope checklist on every room \u2014 every item counts.' },
  ];
  const mySizeMsg = sizeMsg.find((m) => m.rank === sizeRank) ?? sizeMsg[3];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>{tech.avatar}</Text>
          </View>
          <View>
            <Text style={styles.greeting}>Hey, {tech.name}!</Text>
            <Text style={styles.greetingSub}>Here's how you're tracking today</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.rankEmoji}>{rankEmojis[myRank - 1]}</Text>
          <TouchableOpacity style={styles.switchBtn} onPress={() => router.back()}>
            <Text style={styles.switchText}>{'\u2190'} Switch</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* KPI Cards Row */}
        <View style={styles.kpiRow}>
          {/* Closing Ratio */}
          <TouchableOpacity
            style={[styles.kpiCard, expanded === 'ratio' && { borderColor: PDQ_BLUE, backgroundColor: PDQ_BLUE + '15' }]}
            onPress={() => setExpanded(expanded === 'ratio' ? null : 'ratio')}
            activeOpacity={0.8}
          >
            <View style={[styles.kpiBar, { backgroundColor: PDQ_BLUE }]} />
            <Text style={styles.kpiLabel}>Closing Ratio</Text>
            <Text style={[styles.kpiValue, { color: PDQ_BLUE }]}>
              {tech.closingRatio}<Text style={styles.kpiUnit}>%</Text>
            </Text>
            <Text style={[styles.kpiHint, expanded === 'ratio' && { color: '#60a5fa' }]}>
              {expanded === 'ratio' ? '\u25B2 tap to collapse' : 'tap to expand \u25BE'}
            </Text>
          </TouchableOpacity>

          {/* Avg Job Size */}
          <TouchableOpacity
            style={[styles.kpiCard, expanded === 'size' && { borderColor: PDQ_GREEN, backgroundColor: PDQ_GREEN + '15' }]}
            onPress={() => setExpanded(expanded === 'size' ? null : 'size')}
            activeOpacity={0.8}
          >
            <View style={[styles.kpiBar, { backgroundColor: PDQ_GREEN }]} />
            <Text style={styles.kpiLabel}>Avg Job Size</Text>
            <Text style={[styles.kpiValue, { color: PDQ_GREEN, fontSize: 32 }]}>
              ${tech.avgJobSize.toLocaleString()}
            </Text>
            <Text style={[styles.kpiHint, expanded === 'size' && { color: '#4ade80' }]}>
              {expanded === 'size' ? '\u25B2 tap to collapse' : 'tap to expand \u25BE'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Closing Ratio Detail */}
        {expanded === 'ratio' && (
          <View style={styles.detailBox}>
            <View style={[styles.motivationBox, { backgroundColor: myRatioMsg.color + '18', borderColor: myRatioMsg.color + '33' }]}>
              <Text style={[styles.motivationText, { color: myRatioMsg.color }]}>{myRatioMsg.msg}</Text>
            </View>
            <Text style={styles.standingLabel}>TEAM STANDING</Text>
            {leaderboard.map((t, i) => {
              const isMe = t.id === tech.id;
              return (
                <View key={t.id} style={styles.leaderRow}>
                  <View style={styles.leaderInfo}>
                    <Text style={styles.leaderEmoji}>{rankEmojis[i]}</Text>
                    <Text style={[styles.leaderName, isMe && { color: '#60a5fa' }]}>
                      {t.name}{isMe ? ' \u2190 YOU' : ''}
                    </Text>
                  </View>
                  <Text style={[styles.leaderValue, isMe && { color: PDQ_BLUE }]}>{t.closingRatio}%</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${t.closingRatio}%`, backgroundColor: isMe ? PDQ_BLUE : '#2d3f55' }]} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Avg Job Size Detail */}
        {expanded === 'size' && (
          <View style={styles.detailBox}>
            <View style={[styles.motivationBox, { backgroundColor: mySizeMsg.color + '18', borderColor: mySizeMsg.color + '33' }]}>
              <Text style={[styles.motivationText, { color: mySizeMsg.color }]}>{mySizeMsg.msg}</Text>
            </View>
            <Text style={styles.standingLabel}>TEAM STANDING</Text>
            {sizeLeaderboard.map((t, i) => {
              const isMe = t.id === tech.id;
              return (
                <View key={t.id} style={styles.leaderRow}>
                  <View style={styles.leaderInfo}>
                    <Text style={styles.leaderEmoji}>{rankEmojis[i]}</Text>
                    <Text style={[styles.leaderName, isMe && { color: '#4ade80' }]}>
                      {t.name}{isMe ? ' \u2190 YOU' : ''}
                    </Text>
                  </View>
                  <Text style={[styles.leaderValue, isMe && { color: PDQ_GREEN }]}>${t.avgJobSize.toLocaleString()}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${Math.round((t.avgJobSize / 12000) * 100)}%`, backgroundColor: isMe ? PDQ_GREEN : '#2d3f55' }]} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Contest Banner */}
        <View style={styles.contestBox}>
          <View style={styles.contestGoldBar} />
          <Text style={styles.contestTrophy}>{'\uD83C\uDFC6'}</Text>
          <Text style={styles.contestTitle}>END OF MONTH CONTEST</Text>
          <Text style={styles.contestSub}>CLOSING RATIO CHALLENGE</Text>

          {/* 1st place */}
          <View style={styles.prizeRow1}>
            <Text style={styles.prizeEmoji}>{'\uD83E\uDD47'}</Text>
            <View style={styles.prizeMid}>
              <Text style={styles.prizeLabel}>1st Place {'\u2014'} Highest Closing Ratio</Text>
              <Text style={styles.prizeSub}>Team leader at month end</Text>
            </View>
            <View>
              <Text style={styles.prizeAmount}>$1,000</Text>
              <Text style={styles.prizeCash}>CASH</Text>
            </View>
          </View>

          {/* 2nd place */}
          <View style={styles.prizeRow2}>
            <Text style={styles.prizeEmoji}>{'\uD83E\uDD48'}</Text>
            <View style={styles.prizeMid}>
              <Text style={styles.prize2Label}>2nd Place {'\u2014'} Runner Up</Text>
              <Text style={styles.prize2Sub}>Close the gap every day</Text>
            </View>
            <View>
              <Text style={styles.prize2Amount}>$500</Text>
              <Text style={styles.prize2Cash}>CASH</Text>
            </View>
          </View>

          {/* Personalized gap */}
          {myRank === 1 ? (
            <View style={styles.gapBox1}>
              <Text style={styles.gapText1}>{'\uD83D\uDD25'} You're in 1st {'\u2014'} the $1,000 is yours to lose</Text>
              <Text style={styles.gapSub1}>{daysLeft} days left {'\u00B7'} Don't let up</Text>
            </View>
          ) : myRank === 2 ? (
            <View style={styles.gapBox2}>
              <Text style={styles.gapText2}>{'\uD83D\uDCB0'} You're {leaderboard[0].closingRatio - tech.closingRatio}% behind the $1,000 {'\u2014'} close more jobs</Text>
              <Text style={styles.gapSub2}>{daysLeft} days to close the gap {'\u00B7'} $500 is yours now</Text>
            </View>
          ) : (
            <View style={styles.gapBox3}>
              <Text style={styles.gapText3}>{'\u26A1'} {leaderboard[1].closingRatio - tech.closingRatio}% behind $500 {'\u00B7'} {leaderboard[0].closingRatio - tech.closingRatio}% behind $1,000</Text>
              <Text style={styles.gapSub3}>{daysLeft} days left {'\u2014'} every job counts</Text>
            </View>
          )}
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => router.push({ pathname: '/(app)/scope/', params: { techId: tech.id } })}
          activeOpacity={0.8}
        >
          <Text style={styles.continueBtnText}>Let's Go {'\u2014'} Open Dashboard {'\u2192'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_APP },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 2, borderBottomColor: PDQ_ORANGE, backgroundColor: BG_CARD,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatarBox: { width: 44, height: 44, backgroundColor: PDQ_ORANGE, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22 },
  greeting: { fontSize: 18, fontWeight: '900', color: TEXT_PRIMARY },
  greetingSub: { fontSize: 12, color: '#60a5fa' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rankEmoji: { fontSize: 28 },
  switchBtn: { borderWidth: 1, borderColor: '#334155', borderRadius: 7, paddingHorizontal: 10, paddingVertical: 6 },
  switchText: { color: '#94a3b8', fontSize: 11, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 60 },
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  kpiCard: {
    flex: 1, backgroundColor: BG_CARD, borderRadius: 12, padding: 14,
    borderWidth: 2, borderColor: BORDER_COLOR, overflow: 'hidden',
  },
  kpiBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  kpiLabel: { fontSize: 10, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  kpiValue: { fontSize: 44, fontWeight: '900', lineHeight: 48 },
  kpiUnit: { fontSize: 18, color: '#334155' },
  kpiHint: { fontSize: 10, color: '#475569', marginTop: 4, fontWeight: '600' },
  detailBox: { backgroundColor: '#0a0f1a', borderWidth: 1, borderColor: '#1e3a5f33', borderRadius: 10, padding: 14, marginBottom: 14 },
  motivationBox: { borderRadius: 8, padding: 10, borderWidth: 1, marginBottom: 12 },
  motivationText: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  standingLabel: { fontSize: 10, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  leaderRow: { marginBottom: 10 },
  leaderInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  leaderEmoji: { fontSize: 14 },
  leaderName: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  leaderValue: { fontSize: 14, fontWeight: '900', color: '#475569', position: 'absolute', right: 0, top: 0 },
  barTrack: { height: 6, backgroundColor: '#1e293b', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  // Contest
  contestBox: {
    backgroundColor: '#1a0a00', borderWidth: 2, borderColor: PDQ_ORANGE,
    borderRadius: 14, padding: 16, marginBottom: 14, overflow: 'hidden',
  },
  contestGoldBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#fbbf24' },
  contestTrophy: { fontSize: 28, textAlign: 'center', marginBottom: 4 },
  contestTitle: { fontSize: 16, fontWeight: '900', color: '#fbbf24', textAlign: 'center', letterSpacing: 0.5 },
  contestSub: { fontSize: 11, color: PDQ_ORANGE, fontWeight: '700', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  prizeRow1: {
    backgroundColor: '#78350f', borderRadius: 10, padding: 12, flexDirection: 'row',
    alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#fbbf2444', marginBottom: 8,
  },
  prizeEmoji: { fontSize: 28 },
  prizeMid: { flex: 1 },
  prizeLabel: { fontSize: 13, fontWeight: '800', color: '#fbbf24' },
  prizeSub: { fontSize: 11, color: '#fde68a', marginTop: 1 },
  prizeAmount: { fontSize: 24, fontWeight: '900', color: '#fbbf24' },
  prizeCash: { fontSize: 9, color: PDQ_ORANGE, fontWeight: '700', textTransform: 'uppercase', textAlign: 'right' },
  prizeRow2: {
    backgroundColor: '#1e293b', borderRadius: 10, padding: 12, flexDirection: 'row',
    alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#94a3b833', marginBottom: 14,
  },
  prize2Label: { fontSize: 13, fontWeight: '800', color: '#e2e8f0' },
  prize2Sub: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  prize2Amount: { fontSize: 24, fontWeight: '900', color: '#94a3b8' },
  prize2Cash: { fontSize: 9, color: '#64748b', fontWeight: '700', textTransform: 'uppercase', textAlign: 'right' },
  gapBox1: { backgroundColor: PDQ_ORANGE, borderRadius: 8, padding: 10, alignItems: 'center' },
  gapText1: { fontSize: 13, fontWeight: '800', color: '#fff' },
  gapSub1: { fontSize: 11, color: '#fff9', marginTop: 3 },
  gapBox2: { backgroundColor: '#1e3a5f', borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: PDQ_BLUE + '44' },
  gapText2: { fontSize: 13, fontWeight: '800', color: '#60a5fa' },
  gapSub2: { fontSize: 11, color: '#94a3b8', marginTop: 3 },
  gapBox3: { backgroundColor: '#1a0f00', borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: PDQ_ORANGE + '44' },
  gapText3: { fontSize: 13, fontWeight: '800', color: PDQ_ORANGE },
  gapSub3: { fontSize: 11, color: '#9a6a00', marginTop: 3 },
  continueBtn: {
    paddingVertical: 16, borderRadius: 12, backgroundColor: PDQ_BLUE, alignItems: 'center',
  },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
