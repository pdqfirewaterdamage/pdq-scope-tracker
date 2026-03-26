import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSheet } from '../../../../hooks/useSheet';
import { getProject, Project } from '../../../../lib/storage';
import { ReportBuilder } from '../../../../components/report/ReportBuilder';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { generateAndSharePDF } from '../../../../lib/pdf';
import {
  PDQ_BLUE,
  PDQ_DARK,
  PDQ_GRAY,
  PDQ_LIGHT,
  PDQ_RED,
  CAT3_BG,
  CAT3_BORDER,
} from '../../../../constants/colors';

export default function EstimatorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sheet, rooms, loading, error, refresh } = useSheet(id);
  const [project, setProject] = useState<Project | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (sheet?.project_id) {
      getProject(sheet.project_id).then(setProject).catch(() => null);
    }
  }, [sheet?.project_id]);

  const handleExportPDF = async () => {
    if (!project || !sheet) return;
    setExporting(true);
    try {
      const roomsWithItems = rooms.map((r) => ({
        ...r,
        items: r.items,
      }));
      await generateAndSharePDF(project, sheet, roomsWithItems);
    } catch (err: unknown) {
      Alert.alert('Export Failed', err instanceof Error ? err.message : 'Could not export PDF');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PDQ_BLUE} />
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

  return (
    <View style={styles.container}>
      {/* Summary Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.jobName}>{project?.job_name ?? 'Loading…'}</Text>
            <Text style={styles.address}>{project?.address ?? ''}</Text>
          </View>
          <View style={styles.badges}>
            {isCat3 ? <Badge variant="cat3" /> : <Badge variant="cat2" />}
            <Badge variant={sheet.hours_type === 'after' ? 'after' : 'regular'} />
            {sheet.submitted && <Badge variant="submitted" />}
          </View>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            Tech: {sheet.tech_name ?? 'N/A'}
          </Text>
          <Text style={styles.meta}>
            Date:{' '}
            {sheet.date
              ? new Date(sheet.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'N/A'}
          </Text>
        </View>
      </View>

      {isCat3 && (
        <View style={styles.cat3Banner}>
          <Text style={styles.cat3BannerText}>&#9888; CATEGORY 3 JOB</Text>
        </View>
      )}

      {/* Export Button */}
      <View style={styles.exportRow}>
        <Button
          label="Export PDF Report"
          variant="primary"
          size="md"
          loading={exporting}
          onPress={handleExportPDF}
        />
      </View>

      {/* Report Preview */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {project && sheet ? (
          <ReportBuilder
            project={project}
            sheet={sheet}
            rooms={rooms.map((r) => ({ ...r, items: r.items }))}
          />
        ) : (
          <ActivityIndicator color={PDQ_BLUE} style={{ marginTop: 24 }} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PDQ_LIGHT,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  errorText: {
    color: PDQ_RED,
    fontSize: 15,
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  jobName: {
    fontSize: 17,
    fontWeight: '700',
    color: PDQ_DARK,
  },
  address: {
    fontSize: 13,
    color: PDQ_GRAY,
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  meta: {
    fontSize: 13,
    color: PDQ_GRAY,
  },
  cat3Banner: {
    backgroundColor: CAT3_BG,
    borderBottomWidth: 2,
    borderBottomColor: CAT3_BORDER,
    padding: 10,
    alignItems: 'center',
  },
  cat3BannerText: {
    color: PDQ_RED,
    fontWeight: '700',
    fontSize: 13,
  },
  exportRow: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 40,
  },
});
