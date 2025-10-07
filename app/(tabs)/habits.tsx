import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, ChevronLeft, ChevronRight, X, TrendingUp, Calendar as CalendarIcon } from 'lucide-react-native';
import { habitRepository } from '@/repositories/habitRepository';
import { type Habit } from '@/database/schema';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
  addMonths,
  subMonths,
  startOfDay,
} from 'date-fns';

export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [completedDates, setCompletedDates] = useState<Date[]>([]);
  const [monthlyProgress, setMonthlyProgress] = useState({ completedDays: 0, totalDays: 0, percentage: 0 });
  const [currentStreak, setCurrentStreak] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    color: '#10B981',
  });

  const loadHabits = useCallback(async () => {
    const allHabits = await habitRepository.getAll();
    setHabits(allHabits);
    if (allHabits.length > 0 && !selectedHabit) {
      setSelectedHabit(allHabits[0]);
    }
  }, [selectedHabit]);

  const loadHabitData = useCallback(async () => {
    if (!selectedHabit) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const completions = await habitRepository.getCompletionsByMonth(selectedHabit.id, year, month);
    const dates = completions.map((c) => new Date(c.completionDate));
    setCompletedDates(dates);

    const progress = await habitRepository.getMonthlyProgress(selectedHabit.id, year, month);
    setMonthlyProgress(progress);

    const streak = await habitRepository.getCurrentStreak(selectedHabit.id);
    setCurrentStreak(streak);
  }, [selectedHabit, currentDate]);

  useEffect(() => {
    loadHabits();
  }, []);

  useEffect(() => {
    loadHabitData();
  }, [loadHabitData]);

  const handleCreateHabit = async () => {
    if (!newHabit.name.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }

    const created = await habitRepository.create(newHabit);
    setModalVisible(false);
    setNewHabit({
      name: '',
      description: '',
      color: '#10B981',
    });
    await loadHabits();
    setSelectedHabit(created);
  };

  const handleToggleDate = async (date: Date) => {
    if (!selectedHabit) return;

    const isCompleted = completedDates.some((d) => isSameDay(d, date));

    if (isCompleted) {
      await habitRepository.removeCompletion(selectedHabit.id, date);
    } else {
      await habitRepository.addCompletion(selectedHabit.id, date);
    }

    loadHabitData();
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const firstDayOfWeek = monthStart.getDay();
    const emptyDays = Array(firstDayOfWeek).fill(null);

    const allDays = [...emptyDays, ...daysInMonth];

    return (
      <View style={styles.calendarGrid}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <View key={day} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{day}</Text>
          </View>
        ))}

        {allDays.map((day, index) => {
          if (!day) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }

          const isCompleted = completedDates.some((d) => isSameDay(d, day));
          const isToday = isSameDay(day, new Date());
          const isFuture = day > new Date();

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                isCompleted && styles.dayCellCompleted,
                isToday && styles.dayCellToday,
              ]}
              onPress={() => !isFuture && handleToggleDate(day)}
              disabled={isFuture}>
              <Text
                style={[
                  styles.dayText,
                  isCompleted && styles.dayTextCompleted,
                  isToday && styles.dayTextToday,
                  isFuture && styles.dayTextFuture,
                ]}>
                {format(day, 'd')}
              </Text>
              {isCompleted && <View style={styles.completionDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Habits</Text>
          {selectedHabit && <Text style={styles.subtitle}>{selectedHabit.name}</Text>}
        </View>

        {habits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No habits yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to create a habit</Text>
          </View>
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.habitsList}
              contentContainerStyle={styles.habitsListContent}>
              {habits.map((habit) => (
                <TouchableOpacity
                  key={habit.id}
                  style={[
                    styles.habitChip,
                    selectedHabit?.id === habit.id && styles.habitChipSelected,
                    { borderColor: habit.color },
                  ]}
                  onPress={() => setSelectedHabit(habit)}>
                  <Text
                    style={[
                      styles.habitChipText,
                      selectedHabit?.id === habit.id && styles.habitChipTextSelected,
                    ]}>
                    {habit.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.monthNavigation}>
              <TouchableOpacity onPress={() => setCurrentDate(subMonths(currentDate, 1))}>
                <ChevronLeft size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{format(currentDate, 'MMMM yyyy')}</Text>
              <TouchableOpacity onPress={() => setCurrentDate(addMonths(currentDate, 1))}>
                <ChevronRight size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: '#3B82F620' }]}>
                <TrendingUp size={20} color="#3B82F6" />
                <Text style={styles.statNumber}>{currentStreak}</Text>
                <Text style={styles.statLabel}>Current Streak</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: '#10B98120' }]}>
                <CalendarIcon size={20} color="#10B981" />
                <Text style={styles.statNumber}>{monthlyProgress.completedDays}</Text>
                <Text style={styles.statLabel}>Days Completed</Text>
              </View>
            </View>

            {renderCalendar()}

            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <TrendingUp size={20} color="#10B981" />
                <Text style={styles.progressTitle}>Monthly Progress</Text>
              </View>
              <Text style={styles.progressSubtitle}>
                {monthlyProgress.completedDays} days completed this month
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${monthlyProgress.percentage}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressPercentage}>
                {monthlyProgress.percentage.toFixed(0)}%
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Plus size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Habit</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={newHabit.name}
                onChangeText={(text) => setNewHabit({ ...newHabit, name: text })}
                placeholder="e.g., Drink Water, Exercise"
                placeholderTextColor="#6B7280"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newHabit.description}
                onChangeText={(text) => setNewHabit({ ...newHabit, description: text })}
                placeholder="Enter description"
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity style={styles.createButton} onPress={handleCreateHabit}>
                <Text style={styles.createButtonText}>Create Habit</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 4,
  },
  habitsList: {
    marginBottom: 20,
  },
  habitsListContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  habitChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    borderWidth: 2,
  },
  habitChipSelected: {
    backgroundColor: '#10B98120',
  },
  habitChipText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  habitChipTextSelected: {
    color: '#10B981',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  weekdayCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 4,
  },
  dayCellCompleted: {
    backgroundColor: '#10B981',
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  dayText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  dayTextCompleted: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  dayTextToday: {
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  dayTextFuture: {
    color: '#4B5563',
  },
  completionDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  progressCard: {
    marginHorizontal: 20,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#374151',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 6,
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D1D5DB',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
