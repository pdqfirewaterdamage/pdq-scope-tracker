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
  BG_CARD,
  BORDER_COLOR,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_DIM,
  PDQ_ORANGE,
  PDQ_GREEN,
} from '../../constants/colors';

interface ProjectCardProps {
  project: Project;
  onPress: () => void;
  onEstimatorReview?: () => void;
  onMarkComplete?: () => void;
  onViewReport?: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ProjectCard({ project, onPress, onEstimatorReview, onMarkComplete, onViewReport }: ProjectCardProps) {
  const isCat3 = project.water_category === 'cat3';
  const isComplete = project.status === 'complete';

  return (
    <TouchableOpacity
      style={[styles.card, isComplete && styles.cardComplete]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.topRow}>
        <View style={styles.titleCol}>
          <Text style={styles.jobName}>{project.job_name}</Text>
          {project.address ? (
            <Text style={styles.address}>{project.address}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.badges}>
          <Badge variant={isComplete ? 'complete' : 'active'} />
          {project.water_category && (
            <Badge variant={isCat3 ? 'cat3' : 'cat2'} />
          )}
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{project.job_type}</Text>
          </View>
        </View>
        <Text style={styles.meta}>
          Created {formatDate(project.created_at)}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        {isComplete ? (
          onViewReport ? (
            <TouchableOpacity
              style={styles.viewReportBtn}
              onPress={onViewReport}
              activeOpacity={0.8}
            >
              <Text style={styles.viewReportBtnText}>View Report</Text>
            </TouchableOpacity>
          ) : null
        ) : (
          <>
            {onEstimatorReview && (
              <TouchableOpacity
                style={styles.estimatorBtn}
                onPress={onEstimatorReview}
                activeOpacity={0.8}
              >
                <Text style={styles.estimatorBtnText}>Estimator Review</Text>
              </TouchableOpacity>
            )}
            {onMarkComplete && (
              <TouchableOpacity
                style={styles.markCompleteBtn}
                onPress={onMarkComplete}
                activeOpacity={0.8}
              >
                <Text style={styles.markCompleteBtnText}>Mark Complete</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BG_CARD,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  cardComplete: {
    opacity: 0.7,
  },
  topRow: {
    marginBottom: 12,
  },
  titleCol: {
    flex: 1,
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
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  typeBadge: {
    backgroundColor: '#f973161a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: PDQ_ORANGE,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  meta: {
    fontSize: 12,
    color: TEXT_DIM,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
    paddingTop: 12,
  },
  estimatorBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: PDQ_GREEN,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  estimatorBtnText: {
    color: PDQ_GREEN,
    fontWeight: '700',
    fontSize: 13,
  },
  markCompleteBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  markCompleteBtnText: {
    color: TEXT_MUTED,
    fontWeight: '600',
    fontSize: 13,
  },
  viewReportBtn: {
    flex: 1,
    backgroundColor: PDQ_ORANGE,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewReportBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});
