import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Project } from '../../lib/storage';
import { Badge } from '../ui/Badge';
import {
  PDQ_BLUE,
  PDQ_DARK,
  PDQ_GRAY,
  PDQ_LIGHT,
} from '../../constants/colors';

interface ProjectCardProps {
  project: Project;
  onPress: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ProjectCard({ project, onPress }: ProjectCardProps) {
  const isCat3 = project.water_category === 'cat3';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.titleCol}>
          <Text style={styles.jobName} numberOfLines={1}>
            {project.job_name}
          </Text>
          <Text style={styles.address} numberOfLines={1}>
            {project.address}
          </Text>
        </View>
        <View style={styles.badges}>
          <Badge variant={project.status === 'complete' ? 'complete' : 'active'} />
          {project.water_category && (
            <Badge variant={isCat3 ? 'cat3' : 'cat2'} />
          )}
        </View>
      </View>

      {/* Bottom row */}
      <View style={styles.bottomRow}>
        <Text style={styles.meta}>{project.job_type}</Text>
        <Text style={styles.meta}>
          Updated {formatDate(project.updated_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleCol: {
    flex: 1,
    marginRight: 12,
  },
  jobName: {
    fontSize: 15,
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
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: {
    fontSize: 12,
    color: PDQ_GRAY,
  },
});
