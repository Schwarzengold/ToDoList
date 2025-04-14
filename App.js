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
import { Ionicons, Feather } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { format, isSameDay } from 'date-fns';
import { useForm, Controller } from 'react-hook-form';
import { Picker } from '@react-native-picker/picker';

export default function App() {
  const [todos, setTodos] = useState([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [showFormDatePicker, setShowFormDatePicker] = useState(false);
  const [showFormTimePicker, setShowFormTimePicker] = useState(false);
  const [filter, setFilter] = useState('all');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [tempFilter, setTempFilter] = useState('all');
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [selectedSound, setSelectedSound] = useState('Chime');
  const [tempSound, setTempSound] = useState('Chime');
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { control, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      title: '',
      date: new Date(),
      time: new Date(),
      priority: 'low',
    },
  });
  const formDate = watch('date');
  const formTime = watch('time');

  const safeFormat = (dateValue, formatStr) => {
    const d = new Date(dateValue);
    return isNaN(d.getTime()) ? '' : format(d, formatStr);
  };

  useEffect(() => {
    const loadTodos = async () => {
      try {
        const data = await AsyncStorage.getItem('todos');
        if (data) setTodos(JSON.parse(data));
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

  const onSubmit = (data) => {
    const newTask = {
      id: Date.now().toString(),
      text: data.title,
      dueDate: data.date,
      dueTime: data.time,
      priority: data.priority,
      status: 'to-do',
    };
    setTodos([...todos, newTask]);
    reset();
    setAddModalVisible(false);
  };

  const toggleTask = (id) => {
    setTodos(prev =>
      prev.map(task =>
        task.id === id ? { ...task, status: task.status === 'to-do' ? 'done' : 'to-do' } : task
      )
    );
  };

  const formatDue = (date, time) => {
    const d = new Date(date);
    const t = new Date(time);
    d.setHours(t.getHours());
    d.setMinutes(t.getMinutes());
    return safeFormat(d, 'dd/MM/yyyy HH:mm');
  };

  const deleteCompletedTasksForSelectedDay = () => {
    setTodos(todos.filter(task => !(isSameDay(new Date(task.dueDate), selectedDate) && task.status === 'done')));
  };

  const getMarkedDates = () => {
    const marks = {};
    todos.forEach(task => {
      const dateKey = safeFormat(task.dueDate, 'yyyy-MM-dd');
      marks[dateKey] = { marked: true, dotColor: '#50cebb' };
    });
    const selectedKey = safeFormat(selectedDate, 'yyyy-MM-dd');
    marks[selectedKey] = { ...(marks[selectedKey] || {}), selected: true, selectedColor: '#2196F3' };
    return marks;
  };

  const filteredTasks = todos.filter(task => {
    if (!isSameDay(new Date(task.dueDate), selectedDate)) return false;
    if (filter === 'active') return task.status === 'to-do';
    if (filter === 'completed') return task.status === 'done';
    if (['low', 'medium', 'high'].includes(filter)) return task.priority === filter;
    return true;
  });

  const totalTasks = todos.filter(t => isSameDay(new Date(t.dueDate), selectedDate)).length;
  const completedTasks = todos.filter(t => isSameDay(new Date(t.dueDate), selectedDate) && t.status === 'done').length;

  const filterOptions = ['all', 'active', 'completed', 'low', 'medium', 'high'];

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'low':
        return { borderLeftColor: '#4CAF50', borderLeftWidth: 5 };
      case 'medium':
        return { borderLeftColor: '#FF9800', borderLeftWidth: 5 };
      case 'high':
        return { borderLeftColor: '#F44336', borderLeftWidth: 5 };
      default:
        return {};
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'low':
        return <Ionicons name="arrow-down-circle" size={20} color="#4CAF50" style={styles.priorityIcon} />;
      case 'medium':
        return <Ionicons name="alert-circle" size={20} color="#FF9800" style={styles.priorityIcon} />;
      case 'high':
        return <Ionicons name="warning" size={20} color="#F44336" style={styles.priorityIcon} />;
      default:
        return null;
    }
  };

  return (
    <LinearGradient colors={['#FCE38A', '#F38181']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ToDo List</Text>
          <Text style={styles.headerDate}>{safeFormat(selectedDate, 'do MMMM yyyy')}</Text>
        </View>
        <FlatList
          data={filteredTasks}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.taskCard, getPriorityStyle(item.priority)]} onPress={() => toggleTask(item.id)} activeOpacity={0.8}>
              <View style={styles.taskRow}>
                <Ionicons name={item.status === 'done' ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={item.status === 'done' ? '#4CAF50' : '#aaa'} style={styles.checkboxIcon} />
                <Text style={[styles.taskText, item.status === 'done' && styles.taskCompleted]}>
                  {item.text}
                </Text>
                {getPriorityIcon(item.priority)}
              </View>
              <Text style={styles.taskTime}>{formatDue(item.dueDate, item.dueTime)}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
        <View style={styles.bottomNav}>
          <TouchableOpacity onPress={() => setCalendarModalVisible(true)} style={styles.navButton}>
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
          <TouchableOpacity onPress={() => { setValue('date', selectedDate); setAddModalVisible(true); }} style={styles.plusButton}>
            <Ionicons name="add" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
        <Modal visible={addModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Task</Text>
              <Controller
                control={control}
                name="title"
                rules={{ required: true }}
                render={({ field: { onChange, value } }) => (
                  <TextInput style={styles.input} placeholder="Task title" onChangeText={onChange} value={value} />
                )}
              />
              <Text style={styles.label}>Priority:</Text>
              <Controller
                control={control}
                name="priority"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.pickerWrapper}>
                    <Picker selectedValue={value} onValueChange={onChange} style={styles.picker}>
                      <Picker.Item label="Low" value="low" />
                      <Picker.Item label="Medium" value="medium" />
                      <Picker.Item label="High" value="high" />
                    </Picker>
                  </View>
                )}
              />
              <TouchableOpacity onPress={() => setShowFormDatePicker(true)} style={styles.timePickerButton}>
                <Text style={styles.timePickerText}>{safeFormat(formDate, 'dd/MM/yyyy')}</Text>
              </TouchableOpacity>
              {showFormDatePicker && (
                <DateTimePickerModal
                  isVisible={showFormDatePicker}
                  mode="date"
                  onConfirm={(date) => { setValue('date', date); setShowFormDatePicker(false); }}
                  onCancel={() => setShowFormDatePicker(false)}
                />
              )}
              <TouchableOpacity onPress={() => setShowFormTimePicker(true)} style={styles.timePickerButton}>
                <Text style={styles.timePickerText}>{safeFormat(formTime, 'HH:mm')}</Text>
              </TouchableOpacity>
              {showFormTimePicker && (
                <DateTimePickerModal
                  isVisible={showFormTimePicker}
                  mode="time"
                  onConfirm={(time) => { setValue('time', time); setShowFormTimePicker(false); }}
                  onCancel={() => setShowFormTimePicker(false)}
                />
              )}
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={handleSubmit(onSubmit)} style={styles.modalActionButton}>
                  <Text style={styles.modalActionText}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { reset(); setAddModalVisible(false); }} style={[styles.modalActionButton, { backgroundColor: '#E53935' }]}>
                  <Text style={styles.modalActionText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <Modal visible={calendarModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.calendarModal}>
              <Calendar
                current={safeFormat(selectedDate, 'yyyy-MM-dd')}
                markedDates={getMarkedDates()}
                onDayPress={(day) => {
                  setSelectedDate(new Date(day.timestamp));
                  setCalendarModalVisible(false);
                }}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setCalendarModalVisible(false)} style={[styles.modalActionButton, { backgroundColor: '#E53935' }]}>
                  <Text style={styles.modalActionText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <Modal visible={filterModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.filterModal}>
              <Text style={styles.modalTitle}>Filter Tasks</Text>
              {filterOptions.map(option => (
                <TouchableOpacity key={option} onPress={() => setTempFilter(option)} style={[styles.filterOption, tempFilter === option && styles.filterOptionActive]}>
                  <Text style={[styles.filterOptionText, tempFilter === option && styles.filterOptionTextActive]}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
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

const getPriorityStyle = (priority) => {
  switch (priority) {
    case 'low':
      return { borderLeftColor: '#4CAF50', borderLeftWidth: 5 };
    case 'medium':
      return { borderLeftColor: '#FF9800', borderLeftWidth: 5 };
    case 'high':
      return { borderLeftColor: '#F44336', borderLeftWidth: 5 };
    default:
      return {};
  }
};

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
  calendarModal: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
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
  label: {
    fontSize: 16,
    marginBottom: 4,
    color: '#333',
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
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
  },
  picker: {
    height: 50,
    width: '100%',
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
  priorityIcon: {
    marginLeft: 8,
  },
});
