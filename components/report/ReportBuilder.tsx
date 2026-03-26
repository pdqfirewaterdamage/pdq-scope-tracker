import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Project, Sheet, Room, Item } from '../../lib/storage';
import { PDQ_BLUE, PDQ_DARK, PDQ_GRAY, PDQ_GREEN, PDQ_RED, PDQ_LIGHT } from '../../constants/colors';

interface RoomWithItems extends Room {
  items: Item[];
}

interface ReportBuilderProps {
  project: Project;
  sheet: Sheet;
  rooms: RoomWithItems[];
}

const STATUS_ICON: Record<Item['status'], string> = {
  done: '✓',
  not_needed: '—',
  pending: '○',
};

const STATUS_COLOR: Record<Item['status'], string> = {
  done: PDQ_GREEN,
  not_needed: PDQ_GRAY,
  pending: '#f59e0b',
};

export function ReportBuilder({ project, sheet, rooms }: ReportBuilderProps) {
  const isCat3 = project.water_category === 'cat3';

  const doneCount = rooms.reduce(
    (acc, r) => acc + r.items.filter((i) => i.status === 'done').length,
    0
  );
  const totalCount = rooms.reduce((acc, r) => acc + r.items.length, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.companyName}>PDQ Restoration</Text>
        <Text style={styles.reportTitle}>Daily Scope Report</Text>
      </View>

      {/* Project Info */}
      <View style={styles.section}>
        <View style={styles.infoGrid}>
          <InfoRow label="Job" value={project.job_name} />
          <InfoRow label="Address" value={project.address ?? '—'} />
          <InfoRow
            label="Date"
            value={
              sheet.date
                ? new Date(sheet.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : '—'
            }
          />
          <InfoRow label="Technician" value={sheet.tech_name ?? '—'} />
          <InfoRow
            label="Hours Type"
            value={sheet.hours_type === 'after' ? 'After Hours' : 'Regular Hours'}
          />
          <InfoRow
            label="Water Category"
            value={isCat3 ? '☣️ Category 3 — Black Water' : '💧 Category 2 — Gray Water'}
          />
        </View>
      </View>

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>
          {doneCount} / {totalCount} items completed
        </Text>
        {sheet.submitted && (
          <Text style={styles.submittedBadge}>
            ✓ Submitted{' '}
            {sheet.submitted_at
              ? new Date(sheet.submitted_at).toLocaleString()
              : ''}
          </Text>
        )}
      </View>

      {/* Contents Section */}
      {sheet.contents_status && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phase 2 — Contents</Text>
          <InfoRow
            label="Contents Needed"
            value={
              sheet.contents_status === 'yes'
                ? 'Yes'
                : sheet.contents_status === 'not_sure'
                ? 'Not Sure — Supervisor notified'
                : 'No'
            }
          />
          {sheet.contents_status === 'yes' && (
            <>
              <InfoRow
                label="Medium Boxes"
                value={sheet.contents_boxes?.toString() ?? '—'}
              />
              <InfoRow
                label="Cleaning Hours"
                value={sheet.contents_hours?.toString() ?? '—'}
              />
            </>
          )}
        </View>
      )}

      {/* Rooms */}
      {rooms.map((room) => (
        <View key={room.id} style={styles.roomCard}>
          <View style={styles.roomHeader}>
            <Text style={styles.roomName}>{room.name}</Text>
            <Text style={styles.roomCount}>
              {room.items.filter((i) => i.status === 'done').length}/{room.items.length} done
            </Text>
          </View>

          {/* Group by subsection */}
          {Object.entries(
            room.items.reduce<Record<string, Item[]>>((acc, item) => {
              const key = item.subsection;
              if (!acc[key]) acc[key] = [];
              acc[key].push(item);
              return acc;
            }, {})
          ).map(([subsection, items]) => (
            <View key={subsection} style={styles.subsectionBlock}>
              <Text style={styles.subsectionTitle}>{subsection}</Text>
              {items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <Text
                    style={[styles.itemStatus, { color: STATUS_COLOR[item.status] }]}
                  >
                    {STATUS_ICON[item.status]}
                  </Text>
                  <View style={styles.itemDetails}>
                    <Text
                      style={[
                        styles.itemLabel,
                        item.status === 'not_needed' && styles.strikethrough,
                      ]}
                    >
                      {item.label}
                    </Text>
                    <View style={styles.itemMeta}>
                      {item.status === 'done' && !item.no_hours && (
                        <Text style={styles.metaTag}>
                          {item.hours_type === 'after' ? 'After Hours' : 'Regular'}
                        </Text>
                      )}
                      {item.note ? (
                        <Text style={styles.noteText}>Note: {item.note}</Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      ))}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>PDQ Restoration — Generated {new Date().toLocaleString()}</Text>
      </View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: PDQ_BLUE,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  companyName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  reportTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: PDQ_BLUE,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  infoGrid: {
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    width: 110,
    fontSize: 12,
    fontWeight: '600',
    color: PDQ_GRAY,
    textTransform: 'uppercase',
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    color: PDQ_DARK,
  },
  summaryBar: {
    backgroundColor: PDQ_LIGHT,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: PDQ_DARK,
  },
  submittedBadge: {
    fontSize: 11,
    color: PDQ_GREEN,
    fontWeight: '600',
  },
  roomCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  roomHeader: {
    backgroundColor: PDQ_BLUE,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  roomCount: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  subsectionBlock: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  subsectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: PDQ_GRAY,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
    gap: 8,
  },
  itemStatus: {
    fontSize: 14,
    fontWeight: '700',
    width: 18,
    textAlign: 'center',
    marginTop: 1,
  },
  itemDetails: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 13,
    color: PDQ_DARK,
    lineHeight: 18,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  itemMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  metaTag: {
    fontSize: 10,
    color: '#6366f1',
    backgroundColor: '#ede9fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600',
  },
  noteText: {
    fontSize: 11,
    color: '#7c3aed',
    fontStyle: 'italic',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: PDQ_GRAY,
  },
});
