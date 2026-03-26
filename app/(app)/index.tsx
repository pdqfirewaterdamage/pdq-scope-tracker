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
import { getProjects, createProject, Project } from '../../lib/storage';
import { ProjectCard } from '../../components/cards/ProjectCard';
import { Button } from '../../components/ui/Button';
import {
  PDQ_BLUE,
  PDQ_DARK,
  PDQ_GRAY,
  PDQ_LIGHT,
  PDQ_RED,
} from '../../constants/colors';
import { useAppContext } from '../../context/AppContext';
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PDQ_BLUE} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Projects</Text>
        <View style={styles.topBarActions}>
          <Button
            label="+ New Project"
            variant="primary"
            size="sm"
            onPress={() => setModalVisible(true)}
          />
          <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        contentContainerStyle={projects.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PDQ_BLUE} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>&#128196;</Text>
            <Text style={styles.emptyTitle}>No projects yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap "+ New Project" to get started.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ProjectCard
            project={item}
            onPress={() => router.push(`/(app)/project/${item.id}`)}
          />
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

            <Text style={styles.label}>Job Name *</Text>
            <TextInput
              style={styles.input}
              value={jobName}
              onChangeText={setJobName}
              placeholder="e.g. Smith Residence"
              placeholderTextColor={PDQ_GRAY}
            />

            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="123 Main St, City, ST"
              placeholderTextColor={PDQ_GRAY}
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
    backgroundColor: PDQ_LIGHT,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: PDQ_DARK,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  signOutBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  signOutText: {
    color: PDQ_GRAY,
    fontSize: 13,
  },
  list: {
    padding: 12,
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
    color: PDQ_DARK,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: PDQ_GRAY,
    textAlign: 'center',
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: PDQ_DARK,
  },
  modalClose: {
    color: PDQ_BLUE,
    fontSize: 15,
  },
  modalBody: {
    padding: 16,
  },
  errorBox: {
    backgroundColor: '#fff0f0',
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
    fontSize: 13,
    fontWeight: '600',
    color: PDQ_DARK,
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: PDQ_DARK,
    marginBottom: 14,
    backgroundColor: '#fafafa',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f3f4f6',
  },
  chipActive: {
    backgroundColor: PDQ_BLUE,
    borderColor: PDQ_BLUE,
  },
  chipCat3: {
    backgroundColor: PDQ_RED,
    borderColor: PDQ_RED,
  },
  chipText: {
    fontSize: 13,
    color: PDQ_DARK,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
  createBtn: {
    marginTop: 8,
    marginBottom: 40,
  },
});
