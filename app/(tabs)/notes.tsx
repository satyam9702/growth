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
import { Plus, Trash2, Star, X, FileText } from 'lucide-react-native';
import { noteRepository } from '@/repositories/noteRepository';
import { type Note } from '@/database/schema';

const COLORS = [
  { name: 'Brown', value: '#8B7355' },
  { name: 'Green', value: '#10B981' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Pink', value: '#EC4899' },
];

export default function NotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    color: COLORS[0].value,
  });

  const loadNotes = useCallback(async () => {
    const allNotes = await noteRepository.getAll();
    setNotes(allNotes);
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleCreateOrUpdateNote = async () => {
    if (!newNote.title.trim()) {
      Alert.alert('Error', 'Please enter a note title');
      return;
    }

    if (editingNote) {
      await noteRepository.update(editingNote.id, newNote);
    } else {
      await noteRepository.create(newNote);
    }

    setModalVisible(false);
    setEditingNote(null);
    setNewNote({
      title: '',
      content: '',
      color: COLORS[0].value,
    });
    loadNotes();
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNewNote({
      title: note.title,
      content: note.content || '',
      color: note.color,
    });
    setModalVisible(true);
  };

  const handleDeleteNote = async (id: string) => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await noteRepository.delete(id);
          loadNotes();
        },
      },
    ]);
  };

  const handleTogglePin = async (id: string) => {
    await noteRepository.togglePin(id);
    loadNotes();
  };

  const renderNote = ({ item }: { item: Note }) => (
    <TouchableOpacity
      style={[styles.noteCard, { backgroundColor: item.color + '20' }]}
      onPress={() => handleEditNote(item)}
      activeOpacity={0.7}>
      <View style={styles.noteHeader}>
        <View style={[styles.noteIcon, { backgroundColor: item.color }]}>
          <FileText size={20} color="#FFFFFF" />
        </View>
        <View style={styles.noteActions}>
          <TouchableOpacity
            onPress={() => handleTogglePin(item.id)}
            style={styles.iconButton}>
            <Star
              size={20}
              color={item.pinned ? '#F59E0B' : '#6B7280'}
              fill={item.pinned ? '#F59E0B' : 'transparent'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteNote(item.id)}
            style={styles.iconButton}>
            <Trash2 size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.noteTitle}>{item.title}</Text>
      {item.content && (
        <Text style={styles.noteContent} numberOfLines={3}>
          {item.content}
        </Text>
      )}
    </TouchableOpacity>
  );

  const pinnedNotes = notes.filter((n) => n.pinned);
  const unpinnedNotes = notes.filter((n) => !n.pinned);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notes</Text>
          <Text style={styles.subtitle}>{notes.length} notes</Text>
        </View>
      </View>

      <FlatList
        data={[...pinnedNotes, ...unpinnedNotes]}
        renderItem={renderNote}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          pinnedNotes.length > 0 ? (
            <View style={styles.sectionHeader}>
              <Star size={16} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.sectionTitle}>Pinned</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No notes yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to create a note</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setEditingNote(null);
          setNewNote({
            title: '',
            content: '',
            color: COLORS[0].value,
          });
          setModalVisible(true);
        }}>
        <Plus size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingNote ? 'Edit Note' : 'New Note'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={newNote.title}
                onChangeText={(text) => setNewNote({ ...newNote, title: text })}
                placeholder="Enter note title"
                placeholderTextColor="#6B7280"
              />

              <Text style={styles.label}>Content</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newNote.content}
                onChangeText={(text) => setNewNote({ ...newNote, content: text })}
                placeholder="Write your thoughts..."
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={10}
              />

              <Text style={styles.label}>Color</Text>
              <View style={styles.colorContainer}>
                {COLORS.map((color) => (
                  <TouchableOpacity
                    key={color.value}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color.value },
                      newNote.color === color.value && styles.colorButtonSelected,
                    ]}
                    onPress={() => setNewNote({ ...newNote, color: color.value })}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateOrUpdateNote}>
                <Text style={styles.createButtonText}>
                  {editingNote ? 'Update Note' : 'Create Note'}
                </Text>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  noteCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  noteIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  noteContent: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
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
    height: 200,
    textAlignVertical: 'top',
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorButtonSelected: {
    borderColor: '#FFFFFF',
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
