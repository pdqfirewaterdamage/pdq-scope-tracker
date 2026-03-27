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
} from 'react-native';
import { useRouter } from 'expo-router';
import { getProjects, createProject, Project } from '../../../lib/storage';
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

  const JOB_TYPES: JobType[] = ['Water Mitigation', 'Fire & Smoke', 'General'];
  const CATEGORIES: { label: string; value: WaterCategory }[] = [
    { label: 'Cat 2', value: 'cat2' },
    { label: 'Cat 3', value: 'cat3' },
  ];

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
            />
          </View>
        )}
      />

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
});
