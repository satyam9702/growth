import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, X, Dumbbell, Clock, Flame, Grid3x3, List } from 'lucide-react-native';
import { workoutRepository } from '@/repositories/workoutRepository';
import { type Workout } from '@/database/schema';
import { format } from 'date-fns';

type ViewMode = 'grid' | 'list';

export default function WorkoutsScreen() {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [modalVisible, setModalVisible] = useState(false);
  const [newWorkout, setNewWorkout] = useState({
    name: '',
    description: '',
    category: 'Strength',
    duration: '30',
    estimatedCalories: '200-300',
  });

  const loadWorkouts = useCallback(async () => {
    const allWorkouts = await workoutRepository.getAll();
    const workoutsWithDetails = await Promise.all(
      allWorkouts.map(async (w) => {
        const details = await workoutRepository.getWorkoutWithDetails(w.id);
        return details;
      })
    );
    setWorkouts(workoutsWithDetails.filter((w) => w !== null));
  }, []);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  const handleCreateWorkout = async () => {
    if (!newWorkout.name.trim()) {
      Alert.alert('Error', 'Please enter a workout name');
      return;
    }

    await workoutRepository.create({
      ...newWorkout,
      duration: parseInt(newWorkout.duration) || 30,
    });

    setModalVisible(false);
    setNewWorkout({
      name: '',
      description: '',
      category: 'Strength',
      duration: '30',
      estimatedCalories: '200-300',
    });
    loadWorkouts();
  };

  const handleDeleteWorkout = async (id: string) => {
    Alert.alert('Delete Workout', 'Are you sure you want to delete this workout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await workoutRepository.delete(id);
          loadWorkouts();
        },
      },
    ]);
  };

  const handleCompleteWorkout = async (workoutId: string) => {
    await workoutRepository.addCompletion({
      workoutId,
      completionDate: new Date(),
    });
    loadWorkouts();
    Alert.alert('Success', 'Workout completed!');
  };

  const getFrequencyBadge = (frequency: number) => {
    if (frequency >= 10) return '10x+';
    if (frequency >= 5) return `${frequency}x`;
    if (frequency >= 1) return `${frequency}x`;
    return null;
  };

  const renderGridItem = ({ item }: { item: any }) => (
    <View style={styles.gridCard}>
      <View style={[styles.workoutIcon, { backgroundColor: item.color }]}>
        <Dumbbell size={24} color="#FFFFFF" />
      </View>

      {item.frequency > 0 && (
        <View style={styles.frequencyBadge}>
          <Text style={styles.frequencyText}>{getFrequencyBadge(item.frequency)}</Text>
        </View>
      )}

      <Text style={styles.workoutName}>{item.name}</Text>
      <Text style={styles.workoutCategory}>{item.category}</Text>

      <View style={styles.workoutMetaGrid}>
        <View style={styles.metaItem}>
          <Clock size={12} color="#9CA3AF" />
          <Text style={styles.metaText}>{item.duration} min</Text>
        </View>
        <View style={styles.metaItem}>
          <Flame size={12} color="#EF4444" />
          <Text style={styles.metaText}>{item.estimatedCalories} cal</Text>
        </View>
      </View>

      {item.exercises && item.exercises.length > 0 && (
        <Text style={styles.exerciseCount}>{item.exercises.length} exercises</Text>
      )}

      {item.lastCompletion && (
        <Text style={styles.lastCompleted}>
          Last: {format(new Date(item.lastCompletion.completionDate), 'MMM d')}
        </Text>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.completeButton}
          onPress={() => handleCompleteWorkout(item.id)}>
          <Text style={styles.completeButtonText}>Complete</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteIconButton}
          onPress={() => handleDeleteWorkout(item.id)}>
          <Trash2 size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderListItem = ({ item }: { item: any }) => (
    <View style={styles.listCard}>
      <View style={styles.listCardContent}>
        <View style={[styles.workoutIconSmall, { backgroundColor: item.color }]}>
          <Dumbbell size={20} color="#FFFFFF" />
        </View>

        <View style={styles.listCardInfo}>
          <View style={styles.listCardHeader}>
            <Text style={styles.workoutName}>{item.name}</Text>
            {item.frequency > 0 && (
              <View style={styles.frequencyBadgeSmall}>
                <Text style={styles.frequencyTextSmall}>
                  {getFrequencyBadge(item.frequency)}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.workoutCategory}>{item.category}</Text>

          <View style={styles.workoutMetaList}>
            <View style={styles.metaItem}>
              <Clock size={12} color="#9CA3AF" />
              <Text style={styles.metaText}>{item.duration} min</Text>
            </View>
            <View style={styles.metaItem}>
              <Flame size={12} color="#EF4444" />
              <Text style={styles.metaText}>{item.estimatedCalories} cal</Text>
            </View>
            {item.exercises && item.exercises.length > 0 && (
              <Text style={styles.metaText}>{item.exercises.length} exercises</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.listCardActions}>
        <TouchableOpacity
          style={styles.completeButtonSmall}
          onPress={() => handleCompleteWorkout(item.id)}>
          <Text style={styles.completeButtonTextSmall}>Complete</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteIconButton}
          onPress={() => handleDeleteWorkout(item.id)}>
          <Trash2 size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Workouts</Text>
          <Text style={styles.subtitle}>{workouts.length} workouts available</Text>
        </View>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]}
            onPress={() => setViewMode('grid')}>
            <Grid3x3 size={20} color={viewMode === 'grid' ? '#10B981' : '#9CA3AF'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
            onPress={() => setViewMode('list')}>
            <List size={20} color={viewMode === 'list' ? '#10B981' : '#9CA3AF'} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={workouts}
        renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
        keyExtractor={(item) => item?.id || ''}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={viewMode === 'grid' ? styles.columnWrapper : undefined}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No workouts yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to create a workout</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Plus size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Workout</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={newWorkout.name}
                onChangeText={(text) => setNewWorkout({ ...newWorkout, name: text })}
                placeholder="e.g., Push Workout, Leg Day"
                placeholderTextColor="#6B7280"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newWorkout.description}
                onChangeText={(text) => setNewWorkout({ ...newWorkout, description: text })}
                placeholder="Enter description"
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={4}
              />

              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                value={newWorkout.category}
                onChangeText={(text) => setNewWorkout({ ...newWorkout, category: text })}
                placeholder="e.g., Strength, Cardio"
                placeholderTextColor="#6B7280"
              />

              <Text style={styles.label}>Duration (minutes)</Text>
              <TextInput
                style={styles.input}
                value={newWorkout.duration}
                onChangeText={(text) => setNewWorkout({ ...newWorkout, duration: text })}
                placeholder="30"
                placeholderTextColor="#6B7280"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Estimated Calories</Text>
              <TextInput
                style={styles.input}
                value={newWorkout.estimatedCalories}
                onChangeText={(text) =>
                  setNewWorkout({ ...newWorkout, estimatedCalories: text })
                }
                placeholder="e.g., 200-300"
                placeholderTextColor="#6B7280"
              />

              <TouchableOpacity style={styles.createButton} onPress={handleCreateWorkout}>
                <Text style={styles.createButtonText}>Create Workout</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 4,
  },
  viewButton: {
    padding: 8,
    borderRadius: 6,
  },
  viewButtonActive: {
    backgroundColor: '#374151',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridCard: {
    flex: 1,
    maxWidth: '48%',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  listCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  listCardContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  listCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  listCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  listCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  workoutIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frequencyBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  frequencyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  frequencyBadgeSmall: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  frequencyTextSmall: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  workoutCategory: {
    fontSize: 12,
    color: '#EF4444',
    marginBottom: 8,
  },
  workoutMetaGrid: {
    gap: 8,
    marginBottom: 8,
  },
  workoutMetaList: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  exerciseCount: {
    fontSize: 12,
    color: '#D1D5DB',
    marginBottom: 4,
  },
  lastCompleted: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 8,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  completeButtonSmall: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  completeButtonTextSmall: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteIconButton: {
    padding: 8,
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
    maxHeight: '90%',
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
