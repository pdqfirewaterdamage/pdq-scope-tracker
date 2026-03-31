import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getProjects, createProject, updateProject, getSheets, getRooms, getItems, Project } from '../../../lib/storage';
import { buildCompleteReportHTML } from '../../../lib/templates';
import { ProjectCard } from '../../../components/cards/ProjectCard';
import { Button } from '../../../components/ui/Button';
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
} from '../../../constants/colors';
import { useAppContext } from '../../../context/AppContext';
import { useFocusEffect } from 'expo-router';

type JobType = 'Water Mitigation' | 'Fire & Smoke' | 'General';
type WaterCategory = 'cat2' | 'cat3';

export default function HomeScreen() {
  const router = useRouter();
  const { signOut } = useAppContext();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [jobName, setJobName] = useState('');
  const [address, setAddress] = useState('');
  const [jobType, setJobType] = useState<JobType>('Water Mitigation');
  const [waterCategory, setWaterCategory] = useState<WaterCategory>('cat2');
  const [formError, setFormError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchProjects();
    }, [fetchProjects])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProjects();
  }, [fetchProjects]);

  function resetForm() {
    setJobName('');
    setAddress('');
    setJobType('Water Mitigation');
    setWaterCategory('cat2');
    setFormError(null);
  }

  async function handleCreate() {
    if (!jobName.trim()) {
      setFormError('Job name is required.');
      return;
    }
    if (!address.trim()) {
      setFormError('Address is required.');
      return;
    }
    setCreating(true);
    setFormError(null);
    try {
      const project = await createProject({
        job_name: jobName.trim(),
        address: address.trim(),
        job_type: jobType,
        water_category: jobType === 'Water Mitigation' ? waterCategory : null,
        status: 'active',
      });
      setModalVisible(false);
      resetForm();
      router.push(`/(app)/project/${project.id}`);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create project.');
    } finally {
      setCreating(false);
    }
  }

  // ─── Export Backup ───────────────────────────────────────────────────────────
  const handleExportBackup = useCallback(async () => {
    try {
      const allProjects = await getProjects();
      const projectsWithSheets = [];
      for (const proj of allProjects) {
        const sheets = await getSheets(proj.id);
        projectsWithSheets.push({ ...proj, sheets });
      }
      const backup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        projects: projectsWithSheets,
      };
      const jsonStr = JSON.stringify(backup, null, 2);

      if (Platform.OS === 'web') {
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const dateStr = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `PDQ_backup_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      Alert.alert('Export Complete', `Exported ${allProjects.length} project(s) to backup file.`);
    } catch (err: unknown) {
      Alert.alert('Export Error', err instanceof Error ? err.message : 'Failed to export backup.');
    }
  }, []);

  // ─── Import Backup ───────────────────────────────────────────────────────────
  const handleImportBackup = useCallback(async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.style.display = 'none';
      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) return;
        try {
          const text = await file.text();
          const backup = JSON.parse(text);
          if (!backup.projects || !Array.isArray(backup.projects)) {
            Alert.alert('Invalid File', 'This file does not contain a valid PDQ backup.');
            return;
          }
          let projectCount = 0;
          let sheetCount = 0;
          const existingProjects = await getProjects();
          const existingIds = new Set(existingProjects.map((p) => p.id));

          for (const proj of backup.projects) {
            if (existingIds.has(proj.id)) {
              // Skip existing projects
              continue;
            }
            const { sheets: projSheets, ...projectData } = proj;
            try {
              await createProject({
                job_name: projectData.job_name,
                address: projectData.address,
                job_type: projectData.job_type,
                water_category: projectData.water_category,
                status: projectData.status,
              });
              projectCount++;
            } catch {
              // Skip projects that fail to create
              continue;
            }
          }

          await fetchProjects();
          Alert.alert('Import Complete', `Imported ${projectCount} new project(s).`);
        } catch (err: unknown) {
          Alert.alert('Import Error', err instanceof Error ? err.message : 'Failed to parse backup file.');
        }
      };
      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    } else {
      Alert.alert('Not Supported', 'Import is currently only supported on web.');
    }
  }, [fetchProjects]);

  const JOB_TYPES: JobType[] = ['Water Mitigation', 'Fire & Smoke', 'General'];
  const CATEGORIES: { label: string; value: WaterCategory }[] = [
    { label: 'Cat 2', value: 'cat2' },
    { label: 'Cat 3', value: 'cat3' },
  ];

  // ─── Collect all rooms with items for a project ─────────────────────────────
  const collectRoomsWithItems = useCallback(async (projectId: string) => {
    const sheets = await getSheets(projectId);
    const allRooms: any[] = [];
    for (const sheet of sheets) {
      const rooms = await getRooms(sheet.id);
      for (const room of rooms) {
        const items = await getItems(room.id);
        allRooms.push({ ...room, items });
      }
    }
    return { sheets, allRooms };
  }, []);

  // ─── Open HTML report in new browser tab ───────────────────────────────────
  const openReportInBrowser = useCallback((html: string) => {
    if (Platform.OS === 'web') {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Revoke after a delay so the tab can load
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
  }, []);

  // ─── Mark Complete handler ─────────────────────────────────────────────────
  const handleMarkComplete = useCallback((project: Project) => {
    Alert.alert(
      'Mark Complete',
      `Mark "${project.job_name}" as complete? This will generate the complete job package.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await updateProject(project.id, { status: 'complete' });
              const { sheets, allRooms } = await collectRoomsWithItems(project.id);
              const html = buildCompleteReportHTML(project, sheets, allRooms);
              openReportInBrowser(html);
              await fetchProjects();
              Alert.alert('Success', `"${project.job_name}" marked complete. Report generated.`);
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to mark project complete.');
            }
          },
        },
      ]
    );
  }, [collectRoomsWithItems, openReportInBrowser, fetchProjects]);

  // ─── View Report handler ───────────────────────────────────────────────────
  const handleViewReport = useCallback(async (project: Project) => {
    try {
      const { sheets, allRooms } = await collectRoomsWithItems(project.id);
      if (sheets.length === 0) {
        Alert.alert('No Sheets', 'No sheets found for this project.');
        return;
      }
      const html = buildCompleteReportHTML(project, sheets, allRooms);
      openReportInBrowser(html);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to generate report.');
    }
  }, [collectRoomsWithItems, openReportInBrowser]);

  const activeProjects = projects.filter((p) => p.status === 'active');
  const completedProjects = projects.filter((p) => p.status === 'complete');

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PDQ_ORANGE} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* New Project Button */}
      <View style={styles.newProjectRow}>
        <Button
          label="+ New Project"
          variant="primary"
          size="lg"
          onPress={() => setModalVisible(true)}
        />
        <View style={styles.backupRow}>
          <TouchableOpacity
            style={styles.backupBtn}
            onPress={handleExportBackup}
            activeOpacity={0.8}
          >
            <Text style={styles.backupBtnText}>{'\uD83D\uDCE4'} Export Backup</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backupBtn}
            onPress={handleImportBackup}
            activeOpacity={0.8}
          >
            <Text style={styles.backupBtnText}>{'\uD83D\uDCE5'} Import Backup</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        contentContainerStyle={projects.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PDQ_ORANGE} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>&#128203;</Text>
            <Text style={styles.emptyTitle}>No projects yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap "+ New Project" to get started.
            </Text>
          </View>
        }
        ListHeaderComponent={
          projects.length > 0 ? (
            <View>
              {activeProjects.length > 0 && (
                <Text style={styles.sectionLabel}>Active Projects</Text>
              )}
            </View>
          ) : null
        }
        renderItem={({ item, index }) => (
          <View>
            {/* Show "Completed" divider */}
            {item.status === 'complete' && (index === 0 || projects[index - 1]?.status !== 'complete') && (
              <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Completed</Text>
            )}
            <ProjectCard
              project={item}
              onPress={() => router.push(`/(app)/project/${item.id}`)}
              onEstimatorReview={item.status === 'active' ? () => {
                // Navigate to first submitted sheet's estimator view, or project detail
                getSheets(item.id).then((sheets) => {
                  const submitted = sheets.find((s) => s.submitted);
                  if (submitted) {
                    router.push(`/(app)/project/estimator/${submitted.id}`);
                  } else if (sheets.length > 0) {
                    router.push(`/(app)/project/estimator/${sheets[0].id}`);
                  } else {
                    Alert.alert('No Sheets', 'Create a sheet first before reviewing.');
                  }
                }).catch(() => Alert.alert('Error', 'Failed to load sheets.'));
              } : undefined}
              onMarkComplete={item.status === 'active' ? () => handleMarkComplete(item) : undefined}
              onViewReport={item.status === 'complete' ? () => handleViewReport(item) : undefined}
            />
          </View>
        )}
      />

      {/* Dev Links */}
      <View style={styles.devLinksRow}>
        <TouchableOpacity onPress={() => router.push('/(app)/scope/debug')} activeOpacity={0.7}>
          <Text style={styles.devLinkText}>{'\uD83D\uDD27'} Debug</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(app)/scope/whats-new')} activeOpacity={0.7}>
          <Text style={styles.devLinkText}>What's New</Text>
        </TouchableOpacity>
      </View>

      {/* New Project Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Project</Text>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                resetForm();
              }}
            >
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            keyboardShouldPersistTaps="handled"
          >
            {formError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Job Name / Claim #</Text>
            <TextInput
              style={styles.input}
              value={jobName}
              onChangeText={setJobName}
              placeholder="e.g. Smith Residence - Water Loss"
              placeholderTextColor={TEXT_DIM}
            />

            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="123 Main St, City, ST"
              placeholderTextColor={TEXT_DIM}
            />

            <Text style={styles.label}>Job Type</Text>
            <View style={styles.chipRow}>
              {JOB_TYPES.map((jt) => (
                <TouchableOpacity
                  key={jt}
                  style={[styles.chip, jobType === jt && styles.chipActive]}
                  onPress={() => setJobType(jt)}
                >
                  <Text
                    style={[styles.chipText, jobType === jt && styles.chipTextActive]}
                  >
                    {jt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {jobType === 'Water Mitigation' && (
              <>
                <Text style={styles.label}>Water Category</Text>
                <View style={styles.chipRow}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      style={[
                        styles.chip,
                        waterCategory === cat.value && styles.chipActive,
                        cat.value === 'cat3' &&
                          waterCategory === 'cat3' &&
                          styles.chipCat3,
                      ]}
                      onPress={() => setWaterCategory(cat.value)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          waterCategory === cat.value && styles.chipTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Button
              label="Create Project"
              variant="primary"
              size="lg"
              loading={creating}
              onPress={handleCreate}
              style={styles.createBtn}
            />
          </ScrollView>
        </View>
      </Modal>
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
    backgroundColor: BG_APP,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: BG_CARD,
    borderBottomWidth: 2,
    borderBottomColor: PDQ_ORANGE,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    backgroundColor: PDQ_ORANGE,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 1,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  topBarSubtitle: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  signOutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 6,
  },
  signOutText: {
    color: TEXT_MUTED,
    fontSize: 14,
  },
  newProjectRow: {
    padding: 16,
  },
  backupRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  backupBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  backupBtnText: {
    color: TEXT_MUTED,
    fontWeight: '600',
    fontSize: 13,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: TEXT_DIM,
    marginBottom: 10,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  empty: {
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: BG_APP,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    backgroundColor: BG_CARD,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  modalClose: {
    color: PDQ_ORANGE,
    fontSize: 15,
    fontWeight: '600',
  },
  modalBody: {
    padding: 16,
  },
  errorBox: {
    backgroundColor: '#ef44441a',
    borderColor: PDQ_RED,
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: PDQ_RED,
    fontSize: 13,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: TEXT_MUTED,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: TEXT_SECONDARY,
    marginBottom: 14,
    backgroundColor: BG_INPUT,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    backgroundColor: BG_INPUT,
  },
  chipActive: {
    backgroundColor: PDQ_ORANGE,
    borderColor: PDQ_ORANGE,
  },
  chipCat3: {
    backgroundColor: PDQ_RED,
    borderColor: PDQ_RED,
  },
  chipText: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
  createBtn: {
    marginTop: 20,
    marginBottom: 40,
  },
  devLinksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  devLinkText: {
    color: TEXT_DIM,
    fontSize: 13,
    fontWeight: '600',
  },
});
