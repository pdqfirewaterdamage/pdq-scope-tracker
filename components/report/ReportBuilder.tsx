import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Project, Sheet, Room, Item } from '../../lib/storage';

interface RoomWithItems extends Room {
  items: Item[];
}

interface ReportBuilderProps {
  project: Project;
  sheet: Sheet;
  rooms: RoomWithItems[];
}

const STATUS_ICON: Record<Item['status'], string> = {
  done: '\u2713',
  not_needed: '\u2014',
  pending: '\u25CB',
};

const STATUS_COLOR: Record<Item['status'], string> = {
  done: '#22c55e',
  not_needed: '#94a3b8',
  pending: '#f59e0b',
};

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function ReportBuilder({ project, sheet, rooms }: ReportBuilderProps) {
  const isCat3 = project.water_category === 'cat3';
  const doneCount = rooms.reduce(
    (acc, r) => acc + r.items.filter((i) => i.status === 'done').length,
    0
  );
  const totalCount = rooms.reduce((acc, r) => acc + r.items.length, 0);

  return (
    <View style={styles.document}>
      {/* Document Header */}
      <View style={styles.docHeader}>
        <View style={styles.docHeaderLeft}>
          <Text style={styles.companyName}>PDQ Restoration</Text>
          <Text style={styles.reportSubtitle}>Daily Scope of Work Report</Text>
        </View>
        <View style={styles.docHeaderRight}>
          <Text style={styles.dateGenerated}>
            {formatDate(new Date().toISOString())}
          </Text>
        </View>
      </View>
      <View style={styles.headerLine} />

      {/* Project Info Block */}
      <View style={styles.infoBlock}>
        <Text style={styles.projectName}>{project.job_name}</Text>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: isCat3 ? '#ef4444' : '#3b82f6' }]}>
            <Text style={styles.badgeText}>{isCat3 ? 'CAT 3' : 'CAT 2'}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: sheet.hours_type === 'after' ? '#f59e0b' : '#22c55e' }]}>
            <Text style={styles.badgeText}>
              {sheet.hours_type === 'after' ? 'After Hours' : 'Regular'}
            </Text>
          </View>
          {sheet.submitted && (
            <View style={[styles.badge, { backgroundColor: '#22c55e' }]}>
              <Text style={styles.badgeText}>{'\u2713'} Submitted</Text>
            </View>
          )}
        </View>

        <View style={styles.infoGrid}>
          <InfoRow label="Address" value={project.address || '\u2014'} />
          <InfoRow label="Job Type" value={project.job_type} />
          <InfoRow label="Technician" value={sheet.tech_name || '\u2014'} />
          <InfoRow label="Date" value={sheet.date ? formatDate(sheet.date) : '\u2014'} />
          <InfoRow
            label="Water Cat."
            value={isCat3 ? 'Category 3 \u2014 Black Water' : 'Category 2 \u2014 Gray Water'}
          />
        </View>
      </View>

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>
          {doneCount} / {totalCount} items completed
        </Text>
        {sheet.submitted && sheet.submitted_at && (
          <Text style={styles.submittedTime}>
            Submitted {new Date(sheet.submitted_at).toLocaleString()}
          </Text>
        )}
      </View>

      {/* Contents */}
      {sheet.contents_status === 'yes' && (
        <View style={styles.contentsBlock}>
          <Text style={styles.contentsBadge}>{'\uD83D\uDCE6'} Contents Job Required</Text>
          <View style={styles.contentsRow}>
            <View style={styles.contentsItem}>
              <Text style={styles.contentsValue}>{sheet.contents_boxes ?? 0}</Text>
              <Text style={styles.contentsLabel}>Med. Boxes</Text>
            </View>
            <View style={styles.contentsItem}>
              <Text style={styles.contentsValue}>{sheet.contents_hours ?? 0}</Text>
              <Text style={styles.contentsLabel}>Hrs Cleaning</Text>
            </View>
          </View>
        </View>
      )}

      {/* Rooms */}
      {rooms.map((room) => {
        const roomDone = room.items.filter((i) => i.status === 'done').length;
        const grouped: Record<string, Item[]> = {};
        for (const item of room.items) {
          const key = item.subsection;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(item);
        }

        return (
          <View key={room.id} style={styles.roomBlock}>
            <View style={styles.roomHeader}>
              <Text style={styles.roomName}>{'\uD83C\uDFE0'} {room.name}</Text>
              <Text style={styles.roomCount}>
                {'\u2713'} {roomDone}/{room.items.length}
              </Text>
            </View>

            {Object.entries(grouped).map(([subsection, items]) => (
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
                      {item.status === 'done' && !item.no_hours && (
                        <Text style={styles.hoursTag}>
                          {item.hours_type === 'after' ? 'After Hours' : 'Regular'}
                        </Text>
                      )}
                      {item.note ? (
                        <Text style={styles.noteText}>{'\uD83D\uDCDD'} {item.note}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        );
      })}

      {/* Footer */}
      <View style={styles.docFooter}>
        <Text style={styles.footerLine} />
        <Text style={styles.footerText}>
          PDQ Restoration {'\u2014'} Confidential
        </Text>
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
  // White document look
  document: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  docHeaderLeft: {},
  docHeaderRight: {
    alignItems: 'flex-end',
  },
  companyName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1565A8',
    letterSpacing: 0.5,
  },
  reportSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  dateGenerated: {
    fontSize: 11,
    color: '#6b7280',
  },
  headerLine: {
    height: 3,
    backgroundColor: '#1565A8',
    borderRadius: 2,
    marginBottom: 20,
  },
  // Project info
  infoBlock: {
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  projectName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  infoGrid: {
    gap: 2,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    width: 90,
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    color: '#1e293b',
  },
  // Summary
  summaryBar: {
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  submittedTime: {
    fontSize: 11,
    color: '#22c55e',
    fontWeight: '600',
  },
  // Contents
  contentsBlock: {
    backgroundColor: '#f5f3ff',
    borderRadius: 6,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#a855f7',
  },
  contentsBadge: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7c3aed',
    marginBottom: 10,
  },
  contentsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  contentsItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 10,
  },
  contentsValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#7c3aed',
  },
  contentsLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  // Rooms
  roomBlock: {
    marginBottom: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  roomHeader: {
    backgroundColor: '#1565A8',
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
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
  },
  subsectionBlock: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  subsectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    color: '#1e293b',
    lineHeight: 18,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  hoursTag: {
    fontSize: 10,
    color: '#6366f1',
    backgroundColor: '#ede9fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  noteText: {
    fontSize: 11,
    color: '#7c3aed',
    fontStyle: 'italic',
    marginTop: 2,
  },
  // Footer
  docFooter: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
    alignItems: 'center',
  },
  footerLine: {},
  footerText: {
    fontSize: 11,
    color: '#6b7280',
  },
});
