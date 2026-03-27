import React, { useState, useEffect } from 'react';
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
import { getProject, Project } from '../../../../lib/storage';
import { ReportBuilder } from '../../../../components/report/ReportBuilder';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { buildReportHTML } from '../../../../lib/templates';
import {
  BG_APP,
  BG_CARD,
  BORDER_COLOR,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_DIM,
  PDQ_ORANGE,
  PDQ_RED,
  PDQ_GREEN,
  PDQ_BLUE,
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

      if (Platform.OS === 'web') {
        // Web: open HTML in new tab for printing
        const html = buildReportHTML(project, sheet, roomsWithItems);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const w = window.open(url, '_blank');
        if (w) {
          w.onload = () => {
            setTimeout(() => w.print(), 500);
          };
        }
      } else {
        // Native: use expo-print + expo-sharing
        const { generateAndSharePDF } = require('../../../../lib/pdf');
        await generateAndSharePDF(project, sheet, roomsWithItems);
      }
    } catch (err: unknown) {
      Alert.alert('Export Failed', err instanceof Error ? err.message : 'Could not export PDF');
    } finally {
      setExporting(false);
    }
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
  const doneCount = rooms.reduce(
    (acc, r) => acc + r.items.filter((i: any) => i.status === 'done').length,
    0
  );
  const totalCount = rooms.reduce((acc, r) => acc + r.items.length, 0);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header Card */}
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

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Tech: {sheet.tech_name ?? 'N/A'}</Text>
            <Text style={styles.metaText}>
              {sheet.date
                ? new Date(sheet.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : ''}
            </Text>
          </View>

          {/* Progress */}
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>
              {doneCount}/{totalCount} items completed
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: totalCount > 0 ? `${(doneCount / totalCount) * 100}%` : '0%' },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Share/Export Button */}
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={handleExportPDF}
          disabled={exporting}
          activeOpacity={0.8}
        >
          {exporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.shareBtnText}>
              {'\uD83D\uDCC4'} Share as PDF
            </Text>
          )}
        </TouchableOpacity>

        {/* Document Preview */}
        <Text style={styles.previewLabel}>DOCUMENT PREVIEW</Text>
        {project && sheet ? (
          <ReportBuilder
            project={project}
            sheet={sheet}
            rooms={rooms.map((r) => ({ ...r, items: r.items }))}
          />
        ) : (
          <ActivityIndicator color={PDQ_ORANGE} style={{ marginTop: 24 }} />
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
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
  },
  metaText: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  progressRow: {
    marginTop: 10,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: PDQ_GREEN,
    marginBottom: 6,
  },
  progressBar: {
    height: 4,
    backgroundColor: BORDER_COLOR,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: PDQ_GREEN,
    borderRadius: 2,
  },
  shareBtn: {
    backgroundColor: PDQ_ORANGE,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  shareBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_DIM,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
});
