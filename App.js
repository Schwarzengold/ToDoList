import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons, Feather } from '@expo/vector-icons';
import { format, isSameDay } from 'date-fns';

export default function App() {
  const [todos, setTodos] = useState([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskTime, setNewTaskTime] = useState(null);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [filter, setFilter] = useState('all');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [tempFilter, setTempFilter] = useState('all');
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [selectedSound, setSelectedSound] = useState('Chime');
  const [tempSound, setTempSound] = useState('Chime');
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  useEffect(() => {
    const loadTodos = async () => {
      try {
        const data = await AsyncStorage.getItem('todos');
        if (data) {
          setTodos(JSON.parse(data));
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadTodos();
  }, []);

  useEffect(() => {
    const saveTodos = async () => {
      try {
        await AsyncStorage.setItem('todos', JSON.stringify(todos));
      } catch (e) {
        console.error(e);
      }
    };
    saveTodos();
  }, [todos]);

  const addTask = () => {
    if (!newTaskText.trim() || !newTaskTime) {
      Alert.alert('Error', 'Please enter task text and select time.');
      return;
    }
    const newTask = {
      id: Date.now().toString(),
      text: newTaskText,
      completed: false,
      dueDate: selectedDate,
      dueTime: newTaskTime,
    };
    setTodos([...todos, newTask]);
    setNewTaskText('');
    setNewTaskTime(null);
    setAddModalVisible(false);
  };

  const toggleTask = (id) => {
    setTodos(prev =>
      prev.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const formatDateTime = (date, time) => {
    const dt = new Date(date);
    const t = new Date(time);
    dt.setHours(t.getHours());
    dt.setMinutes(t.getMinutes());
    return format(dt, 'dd/MM/yyyy HH:mm');
  };

  const deleteCompletedTasksForSelectedDay = () => {
    setTodos(todos.filter(task => !(isSameDay(new Date(task.dueDate), selectedDate) && task.completed)));
  };

  const filteredTasks = todos.filter(task => {
    if (!isSameDay(new Date(task.dueDate), selectedDate)) return false;
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const totalTasks = todos.filter(t => isSameDay(new Date(t.dueDate), selectedDate)).length;
  const completedTasks = todos.filter(t => isSameDay(new Date(t.dueDate), selectedDate) && t.completed).length;

  return (
    <LinearGradient colors={['#FCE38A', '#F38181']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ToDo List</Text>
          <Text style={styles.headerDate}>{format(selectedDate, 'do MMMM yyyy')}</Text>
        </View>
        <FlatList
          data={filteredTasks}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.taskCard} onPress={() => toggleTask(item.id)} activeOpacity={0.8}>
              <View style={styles.taskRow}>
                <Ionicons name={item.completed ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={item.completed ? '#4CAF50' : '#aaa'} style={styles.checkboxIcon} />
                <Text style={[styles.taskText, item.completed && styles.taskCompleted]}>{item.text}</Text>
              </View>
              <Text style={styles.taskTime}>{formatDateTime(item.dueDate, item.dueTime)}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
        <View style={styles.bottomNav}>
          <TouchableOpacity onPress={() => setIsCalendarVisible(true)} style={styles.navButton}>
            <Ionicons name="calendar" size={28} color="#FFA000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setTempFilter(filter); setFilterModalVisible(true); }} style={styles.navButton}>
            <Feather name="filter" size={28} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity onPress={deleteCompletedTasksForSelectedDay} style={styles.navButton}>
            <Ionicons name="trash" size={28} color="#E53935" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setTempSound(selectedSound); setNotifModalVisible(true); }} style={styles.navButton}>
            <Ionicons name="notifications" size={28} color="#FF7043" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setProfileModalVisible(true)} style={styles.navButton}>
            <Ionicons name="person" size={28} color="#9C27B0" />
          </TouchableOpacity>
        </View>
        <View style={styles.plusWrapper}>
          <TouchableOpacity onPress={() => setAddModalVisible(true)} style={styles.plusButton}>
            <Ionicons name="add" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
        <Modal visible={addModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Task</Text>
              <TextInput style={styles.input} placeholder="Task title" value={newTaskText} onChangeText={setNewTaskText} />
              <TouchableOpacity onPress={() => setIsTimePickerVisible(true)} style={styles.timePickerButton}>
                <Text style={styles.timePickerText}>{newTaskTime ? format(new Date(newTaskTime), 'HH:mm') : 'Select Time'}</Text>
              </TouchableOpacity>
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={addTask} style={styles.modalActionButton}>
                  <Text style={styles.modalActionText}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setAddModalVisible(false); setNewTaskTime(null); }} style={[styles.modalActionButton, { backgroundColor: '#E53935' }]}>
                  <Text style={styles.modalActionText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {isTimePickerVisible && (
          <DateTimePicker
            value={newTaskTime ? new Date(newTaskTime) : new Date()}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selected) => {
              setIsTimePickerVisible(false);
              if (selected) {
                setNewTaskTime(selected);
              }
            }}
          />
        )}
        <DateTimePickerModal
          isVisible={isCalendarVisible}
          mode="date"
          onConfirm={(date) => { setSelectedDate(date); setIsCalendarVisible(false); }}
          onCancel={() => setIsCalendarVisible(false)}
        />
        <Modal visible={filterModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.filterModal}>
              <Text style={styles.modalTitle}>Filter Tasks</Text>
              <TouchableOpacity onPress={() => setTempFilter('all')} style={[styles.filterOption, tempFilter === 'all' && styles.filterOptionActive]}>
                <Text style={[styles.filterOptionText, tempFilter === 'all' && styles.filterOptionTextActive]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setTempFilter('active')} style={[styles.filterOption, tempFilter === 'active' && styles.filterOptionActive]}>
                <Text style={[styles.filterOptionText, tempFilter === 'active' && styles.filterOptionTextActive]}>Active</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setTempFilter('completed')} style={[styles.filterOption, tempFilter === 'completed' && styles.filterOptionActive]}>
                <Text style={[styles.filterOptionText, tempFilter === 'completed' && styles.filterOptionTextActive]}>Completed</Text>
              </TouchableOpacity>
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => { setFilter(tempFilter); setFilterModalVisible(false); }} style={styles.modalActionButton}>
                  <Text style={styles.modalActionText}>Apply</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)} style={[styles.modalActionButton, { backgroundColor: '#E53935' }]}>
                  <Text style={styles.modalActionText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <Modal visible={notifModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.filterModal}>
              <Text style={styles.modalTitle}>Select Ringtone</Text>
              {['Chime', 'Alert', 'Melody'].map(sound => (
                <TouchableOpacity key={sound} onPress={() => setTempSound(sound)} style={[styles.filterOption, tempSound === sound && styles.filterOptionActive]}>
                  <Text style={[styles.filterOptionText, tempSound === sound && styles.filterOptionTextActive]}>{sound}</Text>
                </TouchableOpacity>
              ))}
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => { setSelectedSound(tempSound); setNotifModalVisible(false); }} style={styles.modalActionButton}>
                  <Text style={styles.modalActionText}>Apply</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setNotifModalVisible(false)} style={[styles.modalActionButton, { backgroundColor: '#E53935' }]}>
                  <Text style={styles.modalActionText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <Modal visible={profileModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.filterModal}>
              <Text style={styles.modalTitle}>Profile Stats</Text>
              <Text style={styles.profileText}>Total Tasks Today: {totalTasks}</Text>
              <Text style={styles.profileText}>Completed: {completedTasks}</Text>
              <View style={[styles.modalButtons, { marginTop: 16 }]}>
                <TouchableOpacity onPress={() => setProfileModalVisible(false)} style={[styles.modalActionButton, { backgroundColor: '#E53935' }]}>
                  <Text style={styles.modalActionText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerDate: {
    fontSize: 16,
    color: '#444',
    marginTop: 4,
  },
  taskCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxIcon: {
    marginRight: 12,
  },
  taskText: {
    fontSize: 18,
    color: '#333',
    flex: 1,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  taskTime: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'right',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  navButton: {
    padding: 10,
  },
  plusWrapper: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    zIndex: 10,
  },
  plusButton: {
    backgroundColor: '#2196F3',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    color: '#333',
  },
  timePickerButton: {
    borderWidth: 1,
    borderColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  timePickerText: {
    fontSize: 16,
    color: '#2196F3',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  modalActionButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  modalActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  filterModal: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  filterOption: {
    width: '100%',
    paddingVertical: 10,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbb',
    paddingHorizontal: 12,
  },
  filterOptionActive: {
    borderColor: '#F57C00',
    backgroundColor: '#FFF8E1',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#2196F3',
  },
  filterOptionTextActive: {
    color: '#F57C00',
    fontWeight: 'bold',
  },
  profileText: {
    fontSize: 18,
    color: '#333',
    marginVertical: 4,
  },
});
