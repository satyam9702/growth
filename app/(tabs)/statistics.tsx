import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G } from 'react-native-svg';
import { CheckCircle2, Circle as CircleIcon, TrendingUp, TrendingDown, Zap } from 'lucide-react-native';
import { taskRepository } from '@/repositories/taskRepository';

interface Statistics {
  total: number;
  completed: number;
  pending: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  completionRate: number;
}

export default function StatisticsScreen() {
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    completed: 0,
    pending: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
    completionRate: 0,
  });

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    const stats = await taskRepository.getStatistics();
    setStatistics(stats);
  };

  const DonutChart = () => {
    const { highPriority, mediumPriority, lowPriority } = statistics;
    const total = highPriority + mediumPriority + lowPriority;

    if (total === 0) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.emptyChartText}>No tasks to display</Text>
        </View>
      );
    }

    const radius = 100;
    const strokeWidth = 40;
    const innerRadius = radius - strokeWidth;
    const circumference = 2 * Math.PI * radius;

    const highPercentage = (highPriority / total) * 100;
    const mediumPercentage = (mediumPriority / total) * 100;
    const lowPercentage = (lowPriority / total) * 100;

    const highStrokeDash = (highPercentage / 100) * circumference;
    const mediumStrokeDash = (mediumPercentage / 100) * circumference;
    const lowStrokeDash = (lowPercentage / 100) * circumference;

    const highOffset = 0;
    const mediumOffset = -highStrokeDash;
    const lowOffset = -(highStrokeDash + mediumStrokeDash);

    return (
      <View style={styles.chartContainer}>
        <Svg width={250} height={250} viewBox="0 0 250 250">
          <G rotation="-90" origin="125, 125">
            <Circle
              cx="125"
              cy="125"
              r={radius}
              stroke="#374151"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {lowPriority > 0 && (
              <Circle
                cx="125"
                cy="125"
                r={radius}
                stroke="#10B981"
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${lowStrokeDash} ${circumference}`}
                strokeDashoffset={lowOffset}
                strokeLinecap="round"
              />
            )}
            {mediumPriority > 0 && (
              <Circle
                cx="125"
                cy="125"
                r={radius}
                stroke="#F59E0B"
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${mediumStrokeDash} ${circumference}`}
                strokeDashoffset={mediumOffset}
                strokeLinecap="round"
              />
            )}
            {highPriority > 0 && (
              <Circle
                cx="125"
                cy="125"
                r={radius}
                stroke="#EF4444"
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${highStrokeDash} ${circumference}`}
                strokeDashoffset={highOffset}
                strokeLinecap="round"
              />
            )}
          </G>
        </Svg>
        <View style={styles.chartCenter}>
          <Text style={styles.chartCenterNumber}>{total}</Text>
          <Text style={styles.chartCenterLabel}>Total Tasks</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Task Statistics</Text>
          <Text style={styles.subtitle}>
            {statistics.total} total tasks • {statistics.completed} completed
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#1E40AF20' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#3B82F6' }]}>
              <CheckCircle2 size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.statNumber}>{statistics.total}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#10B98120' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#10B981' }]}>
              <CheckCircle2 size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.statNumber}>{statistics.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Zap size={20} color="#EF4444" />
            <Text style={styles.sectionTitle}>Priority Breakdown</Text>
          </View>

          <DonutChart />

          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendLabel}>High Priority</Text>
              </View>
              <Text style={styles.legendValue}>{statistics.highPriority}</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.legendLabel}>Medium Priority</Text>
              </View>
              <Text style={styles.legendValue}>{statistics.mediumPriority}</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendLabel}>Low Priority</Text>
              </View>
              <Text style={styles.legendValue}>{statistics.lowPriority}</Text>
            </View>
          </View>
        </View>

        <View style={styles.completionCard}>
          <View style={styles.completionHeader}>
            <TrendingUp size={20} color="#10B981" />
            <Text style={styles.completionTitle}>Completion Rate</Text>
          </View>
          <Text style={styles.completionRate}>
            {statistics.completionRate.toFixed(1)}%
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${statistics.completionRate}%` },
              ]}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    position: 'relative',
  },
  chartCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartCenterNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  chartCenterLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  emptyChartText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  legendContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendLabel: {
    fontSize: 16,
    color: '#D1D5DB',
  },
  legendValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  completionCard: {
    marginHorizontal: 20,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
  },
  completionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  completionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  completionRate: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 16,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#374151',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 6,
  },
});
