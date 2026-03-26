import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ItemStatus } from '../../constants/templates';
import {
  PDQ_DARK,
  PDQ_GRAY,
  PDQ_GREEN,
  PDQ_ORANGE,
  PDQ_RED,
} from '../../constants/colors';

interface AsbestosItem {
  id: string;
  label: string;
  status: ItemStatus;
}

interface AsbestosSectionProps {
  items: AsbestosItem[];
  onUpdateItem: (id: string, status: ItemStatus) => void;
}

const STATUS_CYCLE: ItemStatus[] = ['pending', 'done', 'not_needed'];

function nextStatus(current: ItemStatus): ItemStatus {
  const idx = STATUS_CYCLE.indexOf(current);
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}

function statusLabel(s: ItemStatus): string {
  switch (s) {
    case 'done': return '✓';
    case 'not_needed': return '—';
    default: return '○';
  }
}

function statusColor(s: ItemStatus): string {
  switch (s) {
    case 'done': return PDQ_GREEN;
    case 'not_needed': return PDQ_GRAY;
    default: return PDQ_ORANGE;
  }
}

export function AsbestosSection({ items, onUpdateItem }: AsbestosSectionProps) {
  const [statuses, setStatuses] = useState<Record<string, ItemStatus>>(
    () => Object.fromEntries(items.map((i) => [i.id, i.status]))
  );

  function toggle(id: string) {
    const next = nextStatus(statuses[id] ?? 'pending');
    setStatuses((prev) => ({ ...prev, [id]: next }));
    onUpdateItem(id, next);
  }

  return (
    <View style={styles.container}>
      {/* OSHA Warning Sentinel */}
      <View style={styles.osha}>
        <Text style={styles.oshaIcon}>⚠️</Text>
        <Text style={styles.oshaText}>
          OSHA PRE-1980 REQUIREMENT — Asbestos and lead testing mandatory before demolition on
          pre-1980 structures.
        </Text>
      </View>

      {/* Items */}
      {items.map((item) => {
        const status = statuses[item.id] ?? item.status;
        return (
          <View key={item.id} style={styles.row}>
            <Text style={styles.label}>{item.label}</Text>
            <TouchableOpacity
              style={[styles.statusBtn, { borderColor: statusColor(status) }]}
              onPress={() => toggle(item.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.statusText, { color: statusColor(status) }]}>
                {statusLabel(status)}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fffbf0',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: PDQ_ORANGE,
    marginTop: 8,
  },
  osha: {
    backgroundColor: '#fff3cd',
    padding: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: PDQ_ORANGE,
  },
  oshaIcon: {
    fontSize: 16,
  },
  oshaText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#7c4a00',
    lineHeight: 17,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#fde8a0',
  },
  label: {
    fontSize: 13,
    color: PDQ_DARK,
    flex: 1,
  },
  statusBtn: {
    width: 36,
    height: 28,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
