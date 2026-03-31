import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSheet } from '../../../../hooks/useSheet';
import { getProject, getSheets, Sheet, Project, Item } from '../../../../lib/storage';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { buildCompleteReportHTML } from '../../../../lib/templates';
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
  PDQ_RED,
  PDQ_GREEN,
  PDQ_BLUE,
  PDQ_AMBER,
  PDQ_GRAY,
} from '../../../../constants/colors';

export default function EstimatorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sheet, rooms, loading, error, refresh } = useSheet(id);
  const [project, setProject] = useState<Project | null>(null);
  const [allSheets, setAllSheets] = useState<Sheet[]>([]);
  const [exporting, setExporting] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [expandedDayRooms, setExpandedDayRooms] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (sheet?.project_id) {
      getProject(sheet.project_id).then(setProject).catch(() => null);
      getSheets(sheet.project_id).then(setAllSheets).catch(() => null);
    }
  }, [sheet?.project_id]);

  const handleViewReport = useCallback(async () => {
    if (!project || !sheet) return;
    setExporting(true);
    try {
      const roomsWithItems = rooms.map((r) => ({
        ...r,
        items: r.items,
      }));

      if (Platform.OS === 'web') {
        const html = buildCompleteReportHTML(project, allSheets.length > 0 ? allSheets : [sheet], roomsWithItems);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else {
        const { generateAndSharePDF } = require('../../../../lib/pdf');
        await generateAndSharePDF(project, sheet, roomsWithItems);
      }
    } catch (err: unknown) {
      Alert.alert('Export Failed', err instanceof Error ? err.message : 'Could not export report');
    } finally {
      setExporting(false);
    }
  }, [project, sheet, rooms, allSheets]);

  const toggleDay = (sheetId: string) => {
    setExpandedDays((prev) => ({ ...prev, [sheetId]: !prev[sheetId] }));
  };

  const toggleDayRoom = (key: string) => {
    setExpandedDayRooms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PDQ_ORANGE} />
      </View>
    );
  }

  if (error || !sheet) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Sheet not found.'}</Text>
        <Button label="Retry" variant="primary" size="sm" onPress={refresh} />
      </View>
    );
  }

  const isCat3 = project?.water_category === 'cat3';
  const allItems: Item[] = rooms.flatMap((r) => r.items as Item[]);
  const doneCount = allItems.filter((i) => i.status === 'done').length;
  const totalCount = allItems.length;
  const photoCount = allItems.filter((i) => i.require_photo && i.status === 'done').length;

  // Flooring items
  const flooringItems = allItems.filter(
    (i) => i.child_sub === 'Flooring' && i.status === 'done'
  );

  // Rooms with done items
  const roomsWithDone = rooms.filter((r) =>
    (r.items as Item[]).some((i) => i.status === 'done')
  );

  // Sorted sheets for daily breakdown
  const sortedSheets = [...allSheets].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Project Banner */}
        <View style={styles.headerCard}>
          <Text style={styles.jobName}>{project?.job_name ?? 'Loading...'}</Text>
          {project?.address ? (
            <Text style={styles.address}>{project.address}</Text>
          ) : null}
          <View style={styles.badgeRow}>
            {isCat3 ? <Badge variant="cat3" /> : <Badge variant="cat2" />}
            <Badge variant={sheet.hours_type === 'after' ? 'after' : 'regular'} />
            {sheet.submitted && <Badge variant="submitted" />}
          </View>
        </View>

        {/* View Reports Button */}
        <TouchableOpacity
          style={styles.viewReportBtn}
          onPress={handleViewReport}
          disabled={exporting}
          activeOpacity={0.8}
        >
          {exporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.viewReportBtnText}>
              {'\uD83D\uDCC4'} View Reports
            </Text>
          )}
        </TouchableOpacity>

        {/* Project Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Project Summary</Text>
          <View style={styles.statBoxRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{allSheets.length}</Text>
              <Text style={styles.statLabel}>Days</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{rooms.length}</Text>
              <Text style={styles.statLabel}>Rooms</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: PDQ_GREEN }]}>{doneCount}</Text>
              <Text style={styles.statLabel}>Tasks Done</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: PDQ_BLUE }]}>{photoCount}</Text>
              <Text style={styles.statLabel}>Photos</Text>
            </View>
          </View>
        </View>

        {/* Flooring Removed */}
        {flooringItems.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>Flooring Removed</Text>
            <View style={styles.flooringChipRow}>
              {flooringItems.map((item) => (
                <View key={item.id} style={styles.flooringChip}>
                  <Text style={styles.flooringChipText}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Completed Work by Room */}
        {roomsWithDone.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>Completed Work by Room</Text>
            {roomsWithDone.map((room) => {
              const doneItems = (room.items as Item[]).filter((i) => i.status === 'done');
              return (
                <View key={room.id} style={styles.roomBlock}>
                  <View style={styles.roomBlockHeader}>
                    <Text style={styles.roomBlockName}>{room.name}</Text>
                    <Text style={styles.roomBlockCount}>{doneItems.length} done</Text>
                  </View>
                  {doneItems.map((item) => (
                    <View key={item.id} style={styles.doneItemRow}>
                      <Text style={styles.doneItemCheck}>{'\u2713'}</Text>
                      <Text style={styles.doneItemLabel}>{item.label}</Text>
                      {item.qty_value && (
                        <Text style={styles.doneItemQty}>x{item.qty_value}</Text>
                      )}
                      {item.hours != null && item.hours > 0 && (
                        <Text style={styles.doneItemHours}>
                          {item.hours}h {item.hours_type === 'after' ? 'AH' : 'RH'}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* Daily Breakdown */}
        {sortedSheets.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>Daily Breakdown</Text>
            {sortedSheets.map((daySheet, idx) => {
              const isExpanded = expandedDays[daySheet.id] ?? false;
              const dayNum = idx + 1;
              const dateStr = new Date(daySheet.date + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });
              const additionalTechs = daySheet.additional_techs ?? [];

              return (
                <View key={daySheet.id} style={styles.dayCard}>
                  <TouchableOpacity
                    style={styles.dayCardHeader}
                    onPress={() => toggleDay(daySheet.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.dayCardLeft}>
                      <Text style={styles.dayCardDay}>Day {dayNum}</Text>
                      <Text style={styles.dayCardDate}>{dateStr}</Text>
                    </View>
                    <View style={styles.dayCardRight}>
                      {daySheet.submitted && (
                        <View style={styles.daySubmittedBadge}>
                          <Text style={styles.daySubmittedText}>Submitted</Text>
                        </View>
                      )}
                      <Text style={styles.collapseArrow}>{isExpanded ? '\u25BE' : '\u25B8'}</Text>
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.dayCardBody}>
                      {/* Personnel */}
                      <View style={styles.dayMetaRow}>
                        <Text style={styles.dayMetaLabel}>Lead Tech:</Text>
                        <Text style={styles.dayMetaValue}>{daySheet.tech_name ?? 'N/A'}</Text>
                      </View>
                      {additionalTechs.length > 0 && (
                        <View style={styles.dayMetaRow}>
                          <Text style={styles.dayMetaLabel}>Additional:</Text>
                          <Text style={styles.dayMetaValue}>{additionalTechs.join(', ')}</Text>
                        </View>
                      )}
                      <View style={styles.dayMetaRow}>
                        <Text style={styles.dayMetaLabel}>Hours Type:</Text>
                        <Text style={styles.dayMetaValue}>
                          {daySheet.hours_type === 'after' ? 'After Hours' : 'Regular'}
                        </Text>
                      </View>

                      {/* Room tags for this sheet -- show rooms from current view if same sheet */}
                      {daySheet.id === sheet.id && rooms.length > 0 && (
                        <View style={styles.dayRoomTags}>
                          {rooms.map((room) => {
                            const roomKey = `${daySheet.id}_${room.id}`;
                            const roomExpanded = expandedDayRooms[roomKey] ?? false;
                            const roomItems = (room.items as Item[]).filter((i) => i.status === 'done');
                            return (
                              <View key={room.id}>
                                <TouchableOpacity
                                  style={styles.dayRoomTag}
                                  onPress={() => toggleDayRoom(roomKey)}
                                  activeOpacity={0.8}
                                >
                                  <Text style={styles.dayRoomTagText}>
                                    {room.name} ({roomItems.length})
                                  </Text>
                                  <Text style={styles.collapseArrowSm}>
                                    {roomExpanded ? '\u25BE' : '\u25B8'}
                                  </Text>
                                </TouchableOpacity>
                                {roomExpanded && roomItems.map((item) => (
                                  <View key={item.id} style={styles.dayRoomItemRow}>
                                    <Text style={styles.doneItemCheck}>{'\u2713'}</Text>
                                    <Text style={styles.doneItemLabel}>{item.label}</Text>
                                    {item.qty_value && (
                                      <Text style={styles.doneItemQty}>x{item.qty_value}</Text>
                                    )}
                                  </View>
                                ))}
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_APP,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: BG_APP,
  },
  errorText: {
    color: PDQ_RED,
    fontSize: 15,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  // Header
  headerCard: {
    backgroundColor: BG_CARD,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: PDQ_ORANGE,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  jobName: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  address: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  // View Report Button
  viewReportBtn: {
    backgroundColor: PDQ_ORANGE,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  viewReportBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  // Summary Card
  summaryCard: {
    backgroundColor: BG_CARD,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  // Stat Boxes
  statBoxRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: BG_INPUT,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_DIM,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Flooring
  flooringChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  flooringChip: {
    backgroundColor: '#f59e0b1a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  flooringChipText: {
    color: PDQ_AMBER,
    fontSize: 12,
    fontWeight: '600',
  },
  // Room blocks
  roomBlock: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    paddingBottom: 10,
  },
  roomBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  roomBlockName: {
    fontWeight: '700',
    fontSize: 14,
    color: TEXT_PRIMARY,
  },
  roomBlockCount: {
    fontSize: 12,
    fontWeight: '600',
    color: PDQ_GREEN,
  },
  doneItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
    paddingLeft: 8,
  },
  doneItemCheck: {
    color: PDQ_GREEN,
    fontWeight: '700',
    fontSize: 13,
  },
  doneItemLabel: {
    flex: 1,
    color: TEXT_SECONDARY,
    fontSize: 13,
  },
  doneItemQty: {
    color: PDQ_BLUE,
    fontSize: 12,
    fontWeight: '600',
  },
  doneItemHours: {
    color: TEXT_DIM,
    fontSize: 12,
    fontWeight: '500',
  },
  // Daily Breakdown
  dayCard: {
    backgroundColor: BG_INPUT,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    overflow: 'hidden',
  },
  dayCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  dayCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dayCardDay: {
    fontWeight: '700',
    fontSize: 14,
    color: TEXT_PRIMARY,
  },
  dayCardDate: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  dayCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  daySubmittedBadge: {
    backgroundColor: '#22c55e1a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  daySubmittedText: {
    fontSize: 11,
    fontWeight: '700',
    color: PDQ_GREEN,
  },
  collapseArrow: {
    color: TEXT_MUTED,
    fontSize: 14,
  },
  collapseArrowSm: {
    color: TEXT_DIM,
    fontSize: 12,
  },
  dayCardBody: {
    padding: 12,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
  },
  dayMetaRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  dayMetaLabel: {
    color: TEXT_DIM,
    fontSize: 13,
    fontWeight: '600',
    width: 90,
  },
  dayMetaValue: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    flex: 1,
  },
  dayRoomTags: {
    marginTop: 8,
    gap: 4,
  },
  dayRoomTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BG_CARD,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  dayRoomTagText: {
    color: TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: '600',
  },
  dayRoomItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
    paddingLeft: 16,
  },
});
