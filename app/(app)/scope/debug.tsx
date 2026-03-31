import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import {
  BG_APP,
  BG_CARD,
  BORDER_COLOR,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  TEXT_DIM,
  PDQ_ORANGE,
  PDQ_RED,
} from '../../../constants/colors';

const TABLES = ['projects', 'sheets', 'rooms', 'items', 'photos'] as const;
type TableName = (typeof TABLES)[number];

interface TableInfo {
  name: TableName;
  count: number;
  data: any[] | null;
}

export default function StorageDebugScreen() {
  const [tables, setTables] = useState<TableInfo[]>(
    TABLES.map((name) => ({ name, count: 0, data: null }))
  );
  const [loading, setLoading] = useState(false);
  const [expandedTable, setExpandedTable] = useState<TableName | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const results: TableInfo[] = [];
      for (const name of TABLES) {
        const { data, error } = await supabase.from(name).select('*');
        if (error) {
          results.push({ name, count: 0, data: null });
        } else {
          results.push({ name, count: data?.length ?? 0, data });
        }
      }
      setTables(results);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch table data.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on first render
  React.useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete ALL rows from all tables. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Delete in FK-safe order
              const deleteOrder: TableName[] = ['items', 'rooms', 'sheets', 'photos', 'projects'];
              for (const table of deleteOrder) {
                const { error } = await supabase.from(table).delete().neq('id', '');
                if (error) {
                  Alert.alert('Error', `Failed to clear ${table}: ${error.message}`);
                  setLoading(false);
                  return;
                }
              }
              await fetchAll();
              Alert.alert('Done', 'All data cleared.');
            } catch (err) {
              Alert.alert('Error', 'Failed to clear data.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }, [fetchAll]);

  const toggleTable = (name: TableName) => {
    setExpandedTable((prev) => (prev === name ? null : name));
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Storage Debug</Text>
        <Text style={styles.subtitle}>Raw Supabase table data</Text>

        {loading && (
          <ActivityIndicator size="large" color={PDQ_ORANGE} style={{ marginVertical: 20 }} />
        )}

        {tables.map((table) => (
          <View key={table.name} style={styles.tableCard}>
            <TouchableOpacity
              style={styles.tableHeader}
              onPress={() => toggleTable(table.name)}
              activeOpacity={0.7}
            >
              <Text style={styles.tableName}>{table.name}</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{table.count} rows</Text>
              </View>
              <Text style={styles.chevron}>
                {expandedTable === table.name ? '\u25B2' : '\u25BC'}
              </Text>
            </TouchableOpacity>

            {expandedTable === table.name && (
              <ScrollView
                style={styles.jsonContainer}
                nestedScrollEnabled
              >
                <Text style={styles.jsonText} selectable>
                  {table.data
                    ? JSON.stringify(table.data, null, 2)
                    : 'No data or error loading.'}
                </Text>
              </ScrollView>
            )}
          </View>
        ))}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={fetchAll}
            activeOpacity={0.7}
          >
            <Text style={styles.refreshBtnText}>Refresh</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.clearBtn}
            onPress={handleClearAll}
            activeOpacity={0.7}
          >
            <Text style={styles.clearBtnText}>Clear All Data</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: TEXT_DIM,
    marginBottom: 20,
  },
  tableCard: {
    backgroundColor: BG_CARD,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    marginBottom: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  tableName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  countBadge: {
    backgroundColor: PDQ_ORANGE + '22',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 10,
  },
  countText: {
    color: PDQ_ORANGE,
    fontSize: 12,
    fontWeight: '700',
  },
  chevron: {
    color: TEXT_DIM,
    fontSize: 12,
  },
  jsonContainer: {
    maxHeight: 300,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
    padding: 12,
  },
  jsonText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: TEXT_SECONDARY,
    lineHeight: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  refreshBtn: {
    flex: 1,
    backgroundColor: PDQ_ORANGE,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  refreshBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  clearBtn: {
    flex: 1,
    backgroundColor: PDQ_RED + '22',
    borderWidth: 1,
    borderColor: PDQ_RED,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  clearBtnText: {
    color: PDQ_RED,
    fontWeight: '700',
    fontSize: 15,
  },
});
