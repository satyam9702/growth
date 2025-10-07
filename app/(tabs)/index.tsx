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
import { Plus, Trash2, Circle, CheckCircle2, X, CalendarDays } from 'lucide-react-native';
import { taskRepository } from '@/repositories/taskRepository';
import { type Task } from '@/database/schema';
import { format, startOfWeek, addDays } from 'date-fns';

type Priority = 'low' | 'medium' | 'high';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as Priority,
    category: '',
    time: '',
  });

  const loadTasks = useCallback(async () => {
    const allTasks = await taskRepository.getAll();
    setTasks(allTasks);
    applyFilter(allTasks, filter);
  }, [filter]);

  const applyFilter = (taskList: Task[], filterType: typeof filter) => {
    let filtered = taskList;
    if (filterType === 'completed') {
      filtered = taskList.filter((t) => t.completed);
    } else if (filterType === 'pending') {
      filtered = taskList.filter((t) => !t.completed);
    }
    setFilteredTasks(filtered);
  };

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    applyFilter(tasks, filter);
  }, [filter, tasks]);

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    await taskRepository.create({
      ...newTask,
      dueDate: selectedDate,
    });

    setModalVisible(false);
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      category: '',
      time: '',
    });
    loadTasks();
  };

  const handleToggleComplete = async (id: string) => {
    await taskRepository.toggleComplete(id);
    loadTasks();
  };

  const handleDeleteTask = async (id: string) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await taskRepository.delete(id);
          loadTasks();
        },
      },
    ]);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getWeekDays = () => {
    const start = startOfWeek(new Date());
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const renderTask = ({ item }: { item: Task }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <TouchableOpacity onPress={() => handleToggleComplete(item.id)}>
          {item.completed ? (
            <CheckCircle2 size={24} color="#10B981" />
          ) : (
            <Circle size={24} color={getPriorityColor(item.priority)} />
          )}
        </TouchableOpacity>
        <View style={styles.taskContent}>
          <Text style={[styles.taskTitle, item.completed && styles.taskTitleCompleted]}>
            {item.title}
          </Text>
          {item.description && (
            <Text style={styles.taskDescription}>{item.description}</Text>
          )}
          <View style={styles.taskMeta}>
            {item.category && (
              <View style={[styles.categoryBadge, { backgroundColor: '#3B82F6' }]}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            )}
            {item.time && (
              <View style={styles.timeBadge}>
                <Text style={styles.timeText}>{item.time}</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={() => handleDeleteTask(item.id)} style={styles.deleteButton}>
          <Trash2 size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tasks</Text>
          <Text style={styles.subtitle}>{filteredTasks.length} tasks</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        {(['all', 'completed', 'pending'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView horizontal style={styles.weekContainer} showsHorizontalScrollIndicator={false}>
        {getWeekDays().map((day, index) => {
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          return (
            <View key={index} style={[styles.dayCard, isToday && styles.dayCardActive]}>
              <Text style={[styles.dayName, isToday && styles.dayNameActive]}>
                {format(day, 'EEE')}
              </Text>
              <Text style={[styles.dayNumber, isToday && styles.dayNumberActive]}>
                {format(day, 'd')}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to create a task</Text>
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
              <Text style={styles.modalTitle}>New Task</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={newTask.title}
                onChangeText={(text) => setNewTask({ ...newTask, title: text })}
                placeholder="Enter task title"
                placeholderTextColor="#6B7280"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newTask.description}
                onChangeText={(text) => setNewTask({ ...newTask, description: text })}
                placeholder="Enter description"
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={4}
              />

              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityContainer}>
                {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityButton,
                      newTask.priority === p && {
                        backgroundColor: getPriorityColor(p),
                      },
                    ]}
                    onPress={() => setNewTask({ ...newTask, priority: p })}>
                    <Text
                      style={[
                        styles.priorityText,
                        newTask.priority === p && styles.priorityTextActive,
                      ]}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                value={newTask.category}
                onChangeText={(text) => setNewTask({ ...newTask, category: text })}
                placeholder="e.g., Workout, Misc"
                placeholderTextColor="#6B7280"
              />

              <Text style={styles.label}>Time</Text>
              <TextInput
                style={styles.input}
                value={newTask.time}
                onChangeText={(text) => setNewTask({ ...newTask, time: text })}
                placeholder="e.g., 18:00"
                placeholderTextColor="#6B7280"
              />

              <TouchableOpacity style={styles.createButton} onPress={handleCreateTask}>
                <Text style={styles.createButtonText}>Create Task</Text>
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1F2937',
  },
  filterButtonActive: {
    backgroundColor: '#10B981',
  },
  filterText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  weekContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  dayCard: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#1F2937',
    marginRight: 12,
  },
  dayCardActive: {
    backgroundColor: '#10B981',
  },
  dayName: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  dayNameActive: {
    color: '#FFFFFF',
  },
  dayNumber: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dayNumberActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  taskCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskContent: {
    flex: 1,
    marginLeft: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  taskDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  timeText: {
    fontSize: 12,
    color: '#10B981',
  },
  deleteButton: {
    padding: 4,
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
  priorityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#374151',
    alignItems: 'center',
  },
  priorityText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  priorityTextActive: {
    color: '#FFFFFF',
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
