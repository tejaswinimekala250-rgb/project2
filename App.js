
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@taskflow/tasks';
const CATEGORIES = ['Personal', 'Study', 'Work', 'Other'];

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Personal');
  const [screen, setScreen] = useState('Tasks');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // Load saved tasks when the app starts.
  useEffect(() => {
    async function loadTasks() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) setTasks(JSON.parse(saved));
      } catch (error) {
        Alert.alert('Error', 'Could not load saved tasks.');
      } finally {
        setLoaded(true);
      }
    }
    loadTasks();
  }, []);

  // Save tasks whenever the list changes.
  useEffect(() => {
    if (!loaded) return;

    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(tasks)
    ).catch(() => {
      Alert.alert('Error', 'Could not save tasks.');
    });
  }, [tasks, loaded]);

  const completed = tasks.filter(t => t.done).length;
  const active = tasks.length - completed;

  const visibleTasks = tasks.filter(task => {
    const matchesFilter =
      filter === 'All' ||
      (filter === 'Active' && !task.done) ||
      (filter === 'Completed' && task.done);

    const query = search.toLowerCase().trim();
    const matchesSearch =
      task.title.toLowerCase().includes(query) ||
      task.category.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  function clearForm() {
    setTitle('');
    setDescription('');
    setCategory('Personal');
    setEditId(null);
  }

  function saveTask() {
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      Alert.alert('Validation Error', 'Please enter a task title.');
      return;
    }

    if (cleanTitle.length > 80) {
      Alert.alert('Validation Error', 'Title must be 80 characters or fewer.');
      return;
    }

    if (editId !== null) {
      setTasks(previous =>
        previous.map(task =>
          task.id === editId
            ? {
                ...task,
                title: cleanTitle,
                description: description.trim(),
                category,
              }
            : task
        )
      );
    } else {
      setTasks(previous => [
        {
          id: Date.now().toString(),
          title: cleanTitle,
          description: description.trim(),
          category,
          done: false,
        },
        ...previous,
      ]);
    }

    clearForm();
    setScreen('Tasks');
  }

  function editTask(task) {
    setTitle(task.title);
    setDescription(task.description || '');
    setCategory(task.category);
    setEditId(task.id);
    setScreen('Add');
  }

  function toggleTask(id) {
    setTasks(previous =>
      previous.map(task =>
        task.id === id
          ? { ...task, done: !task.done }
          : task
      )
    );
  }

  function deleteTask(id) {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          setTasks(previous =>
            previous.filter(task => task.id !== id)
          ),
      },
    ]);
  }

  function openAdd() {
    clearForm();
    setScreen('Add');
  }

  function button(label, action, selected = false) {
    return (
      <TouchableOpacity
        key={label}
        style={[styles.button, selected && styles.selected]}
        onPress={action}
      >
        <Text style={[styles.buttonText, selected && styles.selectedText]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.brand}>TASKFLOW</Text>
      <Text style={styles.heading}>
        {screen === 'Add' ? (editId ? 'Edit Task' : 'New Task') : screen}
      </Text>
      <Text style={styles.subtitle}>
        Organize your day, one task at a time.
      </Text>

      <View style={styles.navigation}>
        {button('Tasks', () => setScreen('Tasks'), screen === 'Tasks')}
        {button('Add Task', openAdd, screen === 'Add')}
        {button('Overview', () => setScreen('Overview'), screen === 'Overview')}
      </View>

      <ScrollView keyboardShouldPersistTaps="handled">
        {screen === 'Tasks' && (
          <View>
            <View style={styles.stats}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{tasks.length}</Text>
                <Text>Total</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{active}</Text>
                <Text>Active</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{completed}</Text>
                <Text>Completed</Text>
              </View>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Search tasks or categories..."
              value={search}
              onChangeText={setSearch}
            />

            <View style={styles.navigation}>
              {['All', 'Active', 'Completed'].map(item =>
                button(item, () => setFilter(item), filter === item)
              )}
            </View>

            {visibleTasks.length === 0 ? (
              <Text style={styles.empty}>
                No tasks found. Tap Add Task to get started.
              </Text>
            ) : (
              visibleTasks.map(task => (
                <View key={task.id} style={styles.taskCard}>
                  <TouchableOpacity
                    style={styles.taskMain}
                    onPress={() => toggleTask(task.id)}
                  >
                    <Text style={styles.taskTitle}>
                      {task.done ? '☑ ' : '☐ '}
                      {task.title}
                    </Text>
                    <Text style={styles.taskInfo}>
                      {task.category}
                    </Text>
                    {task.description ? (
                      <Text style={styles.taskInfo}>
                        {task.description}
                      </Text>
                    ) : null}
                    <Text style={styles.taskInfo}>
                      {task.done ? 'Completed' : 'In progress'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.actions}>
                    <TouchableOpacity onPress={() => editTask(task)}>
                      <Text style={styles.edit}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteTask(task.id)}>
                      <Text style={styles.delete}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            <TouchableOpacity style={styles.primary} onPress={openAdd}>
              <Text style={styles.primaryText}>+ Add New Task</Text>
            </TouchableOpacity>
          </View>
        )}

        {screen === 'Add' && (
          <View style={styles.form}>
            <Text style={styles.label}>TASK TITLE *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter task title"
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />

            <Text style={styles.label}>DESCRIPTION</Text>
            <TextInput
              style={[styles.input, styles.description]}
              placeholder="Enter description (optional)"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={240}
            />

            <Text style={styles.label}>CATEGORY</Text>
            <View style={styles.categoryWrap}>
              {CATEGORIES.map(item =>
                button(item, () => setCategory(item), category === item)
              )}
            </View>

            <TouchableOpacity style={styles.primary} onPress={saveTask}>
              <Text style={styles.primaryText}>
                {editId ? 'Save Changes' : 'Create Task'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancel}
              onPress={() => {
                clearForm();
                setScreen('Tasks');
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {screen === 'Overview' && (
          <View style={styles.form}>
            <Text style={styles.sectionHeading}>Your Progress</Text>
            <Text style={styles.progress}>
              {tasks.length
                ? Math.round((completed / tasks.length) * 100)
                : 0}%
            </Text>
            <Text style={styles.taskInfo}>Tasks completed</Text>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      tasks.length
                        ? (completed / tasks.length) * 100
                        : 0
                    }%`,
                  },
                ]}
              />
            </View>

            {CATEGORIES.map(item => (
              <View style={styles.categoryRow} key={item}>
                <Text style={styles.taskTitle}>{item}</Text>
                <Text style={styles.taskInfo}>
                  {tasks.filter(t => t.category === item).length} tasks
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Text style={styles.footer}>TASKFLOW • Your personal task manager</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
    padding: 18,
  },
  brand: {
    color: '#5B5FEF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 12,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#182033',
    marginTop: 5,
  },
  subtitle: {
    color: '#737D92',
    marginTop: 5,
    marginBottom: 18,
  },
  navigation: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
    gap: 7,
  },
  button: {
    backgroundColor: '#E9ECF4',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  selected: {
    backgroundColor: '#5B5FEF',
  },
  buttonText: {
    color: '#596176',
    fontWeight: '600',
    fontSize: 12,
  },
  selectedText: {
    color: '#FFFFFF',
  },
  stats: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    color: '#5B5FEF',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE2ED',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    color: '#182033',
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E9ECF4',
  },
  taskMain: {
    marginBottom: 10,
  },
  taskTitle: {
    color: '#182033',
    fontSize: 15,
    fontWeight: 'bold',
  },
  taskInfo: {
    color: '#737D92',
    fontSize: 12,
    marginTop: 5,
  },
  actions: {
    flexDirection: 'row',
    gap: 20,
  },
  edit: {
    color: '#5054D8',
    fontWeight: 'bold',
  },
  delete: {
    color: '#D84F61',
    fontWeight: 'bold',
  },
  primary: {
    backgroundColor: '#5B5FEF',
    padding: 15,
    borderRadius: 11,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 14,
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  label: {
    color: '#737D92',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
  },
  description: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  cancel: {
    alignItems: 'center',
    padding: 12,
  },
  cancelText: {
    color: '#596176',
    fontWeight: 'bold',
  },
  empty: {
    textAlign: 'center',
    color: '#737D92',
    backgroundColor: '#FFFFFF',
    padding: 25,
    borderRadius: 12,
  },
  sectionHeading: {
    color: '#182033',
    fontSize: 20,
    fontWeight: 'bold',
  },
  progress: {
    fontSize: 42,
    color: '#5B5FEF',
    fontWeight: 'bold',
    marginTop: 18,
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#E9ECF4',
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 18,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#5B5FEF',
  },
  categoryRow: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9ECF4',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footer: {
    textAlign: 'center',
    color: '#A0A7B7',
    fontSize: 10,
    paddingVertical: 8,
  },
});
