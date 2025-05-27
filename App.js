import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import {
  addTask,
  toggleTask,
  removeDoneForDate,
  removeTask,
  selectTasks,
  selectUnfinishedCount,
} from './tasksSlice';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import ProgressBar from './ProgressBar';
import { format, isSameDay } from 'date-fns';
import { useForm, Controller } from 'react-hook-form';
import { Picker } from '@react-native-picker/picker';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { nanoid } from '@reduxjs/toolkit';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function Root() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <App />
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}

function App() {
  const insets = useSafeAreaInsets();
  const tasks = useSelector(selectTasks);
  
  const unfinished = useSelector(selectUnfinishedCount);
  const dispatch = useDispatch();
  const filterOptions = ['all', 'active', 'completed', 'low', 'medium', 'high'];

  const total = tasks.length;

  const done = tasks.filter(t => t.status === 'done').length;

  const progress = total > 0 ? done / total : 0;

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [showFormDatePicker, setShowFormDatePicker] = useState(false);
  const [showFormTimePicker, setShowFormTimePicker] = useState(false);
  const [filter, setFilter] = useState('all');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [tempFilter, setTempFilter] = useState('all');
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [pendingModalVisible, setPendingModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { control, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: { title: '', date: new Date(), time: new Date(), priority: 'low' },
  });
  const formDate = watch('date');
  const formTime = watch('time');

  useEffect(() => {
    (async () => {
      if (Constants.isDevice) {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          await Notifications.requestPermissionsAsync();
        }
      }
      await Notifications.setNotificationCategoryAsync('todo-actions', [
        { identifier: 'show', buttonTitle: 'Show', options: { opensAppToForeground: true } },
        { identifier: 'delete', buttonTitle: 'Delete', options: { isDestructive: true } },
      ]);
    })();
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(r => {
      const id = r.notification.request.content.data.taskId;
      if (r.actionIdentifier === 'delete') dispatch(removeTask(id));
    });
    return () => sub.remove();
  }, [dispatch]);

  const handleRemoveTask = async task => {
    if (task.notificationId)
      try {
        await Notifications.cancelScheduledNotificationAsync(task.notificationId);
      } catch {}
    dispatch(removeTask(task.id));
  };

  const handleDeleteDoneForDay = async () => {
    const done = tasks.filter(
      t => isSameDay(new Date(t.dueDate), selectedDate) && t.status === 'done'
    );
    for (let t of done)
      if (t.notificationId)
        try {
          await Notifications.cancelScheduledNotificationAsync(t.notificationId);
        } catch {}
    dispatch(removeDoneForDate(selectedDate));
  };

  const safeFormat = (d, f) => {
    const dt = new Date(d);
    return isNaN(dt) ? '' : format(dt, f);
  };
  const formatDue = (d, t) => {
    const dt = new Date(d);
    const tm = new Date(t);
    dt.setHours(tm.getHours(), tm.getMinutes());
    return safeFormat(dt, 'dd/MM/yyyy HH:mm');
  };

  const onSubmit = async data => {
    const scheduled = new Date(data.date);
    const tm = new Date(data.time);
    scheduled.setHours(tm.getHours(), tm.getMinutes());
    const id = nanoid();
    let notifId = null;
    try {
      notifId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Task Reminder',
          body: data.title,
          data: { taskId: id },
          categoryIdentifier: 'todo-actions',
        },
        trigger: scheduled,
      });
    } catch {}
    dispatch(
      addTask({
        id,
        text: data.title,
        dueDate: scheduled.toISOString(),
        dueTime: scheduled.toISOString(),
        priority: data.priority,
        status: 'to-do',
        notificationId: notifId,
      })
    );
    reset();
    setAddModalVisible(false);
  };

  const toggle = id => dispatch(toggleTask(id));

  const filtered = tasks.filter(t => {
    if (!isSameDay(new Date(t.dueDate), selectedDate)) return false;
    if (filter === 'active') return t.status === 'to-do';
    if (filter === 'completed') return t.status === 'done';
    if (['low', 'medium', 'high'].includes(filter)) return t.priority === filter;
    return true;
  });
  const pendingTasks = tasks.filter(t => t.status === 'to-do');

  const getMarkedDates = () => {
    const m = {};
    tasks.forEach(t => {
      const k = safeFormat(t.dueDate, 'yyyy-MM-dd');
      m[k] = { marked: true, dotColor: '#50cebb' };
    });
    const sel = safeFormat(selectedDate, 'yyyy-MM-dd');
    m[sel] = { ...(m[sel] || {}), selected: true, selectedColor: '#2196F3' };
    return m;
  };

  const getPriorityStyle = p =>
    p === 'low'
      ? { borderLeftColor: '#4CAF50', borderLeftWidth: 5 }
      : p === 'medium'
      ? { borderLeftColor: '#FF9800', borderLeftWidth: 5 }
      : p === 'high'
      ? { borderLeftColor: '#F44336', borderLeftWidth: 5 }
      : {};
  const getPriorityIcon = p =>
    p === 'low' ? (
      <Ionicons name="arrow-down-circle" size={20} color="#4CAF50" style={styles.priorityIcon} />
    ) : p === 'medium' ? (
      <Ionicons name="alert-circle" size={20} color="#FF9800" style={styles.priorityIcon} />
    ) : p === 'high' ? (
      <Ionicons name="warning" size={20} color="#F44336" style={styles.priorityIcon} />
    ) : null;

  return (
    <LinearGradient colors={['#FCE38A', '#F38181']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ToDo List</Text>
          <Text style={styles.headerDate}>{safeFormat(selectedDate, 'do MMMM yyyy')}</Text>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.taskCard, getPriorityStyle(item.priority)]}
              onPress={() => toggle(item.id)}
              onLongPress={() => handleRemoveTask(item)}
              delayLongPress={350}
            >
              <View style={styles.taskRow}>
                <Ionicons
                  name={item.status === 'done' ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={item.status === 'done' ? '#4CAF50' : '#aaa'}
                  style={styles.checkboxIcon}
                />
                <Text style={[styles.taskText, item.status === 'done' && styles.taskCompleted]}>
                  {item.text}
                </Text>
                {getPriorityIcon(item.priority)}
              </View>
              <Text style={styles.taskTime}>{formatDue(item.dueDate, item.dueTime)}</Text>
            </TouchableOpacity>
          )}
        />

        <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 10 }]}>
          <TouchableOpacity onPress={() => setCalendarModalVisible(true)} style={styles.navButton}>
            <Ionicons name="calendar" size={28} color="#FFA000" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setTempFilter(filter);
              setFilterModalVisible(true);
            }}
            style={styles.navButton}
          >
            <Feather name="filter" size={28} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setPendingModalVisible(true)}
          >
            <Ionicons name="notifications" size={28} color="#FF7043" />
            {unfinished > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unfinished > 99 ? '99+' : unfinished}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteDoneForDay} style={styles.navButton}>
            <Ionicons name="trash" size={28} color="#E53935" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setProfileModalVisible(true)} style={styles.navButton}>
            <Ionicons name="person" size={28} color="#9C27B0" />
          </TouchableOpacity>
        </View>

        <View style={styles.plusWrapper}>
          <TouchableOpacity
            style={styles.plusButton}
            onPress={() => {
              setValue('date', selectedDate);
              setAddModalVisible(true);
            }}
          >
            <Ionicons name="add" size={32} color="#fff" />
          </TouchableOpacity>
        </View>


        {total > 0 && (
          <ProgressBar progress={progress} />
        )}

        <Modal visible={pendingModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.bigModal}>
              <Text style={styles.modalTitle}>All Pending Tasks</Text>
              <FlatList
                data={pendingTasks}
                keyExtractor={(i) => i.id}
                  renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.taskCard, getPriorityStyle(item.priority)]}
                    onPress={() => toggle(item.id)}
                    onLongPress={() => handleRemoveTask(item)}
                    delayLongPress={350}
                  >
                    <View style={styles.taskRow}>
                      <Ionicons
                        name={item.status === 'done' ? 'checkmark-circle' : 'ellipse-outline'}
                        size={24}
                        color={item.status === 'done' ? '#4CAF50' : '#aaa'}
                        style={styles.checkboxIcon}
                      />
                      <Text
                        style={[
                          styles.taskText,
                          item.status === 'done' && styles.taskCompleted,
                        ]}
                      >
                        {item.text}
                      </Text>
                      {getPriorityIcon(item.priority)}
                    </View>
                    <Text style={styles.taskTime}>{formatDue(item.dueDate, item.dueTime)}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={{ alignSelf: 'center', marginTop: 20, color: '#555' }}>
                    No pending tasks 🎉
                  </Text>
                }
              />
              <View style={[styles.modalButtons, { marginTop: 12 }]}>
                <TouchableOpacity
                  style={[styles.modalActionButton, { backgroundColor: '#E53935' }]}
                  onPress={() => setPendingModalVisible(false)}
                >
                  <Text style={styles.modalActionText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={addModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Task</Text>
              <Controller
                control={control}
                name="title"
                rules={{ required: true }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Task title"
                    value={value}
                    onChangeText={onChange}
                  />
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
              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() => setShowFormDatePicker(true)}
              >
                <Text style={styles.timePickerText}>{safeFormat(formDate, 'dd/MM/yyyy')}</Text>
              </TouchableOpacity>
              {showFormDatePicker && (
                <DateTimePickerModal
                  isVisible
                  mode="date"
                  onConfirm={(d) => {
                    setValue('date', d);
                    setShowFormDatePicker(false);
                  }}
                  onCancel={() => setShowFormDatePicker(false)}
                />
              )}
              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() => setShowFormTimePicker(true)}
              >
                <Text style={styles.timePickerText}>{safeFormat(formTime, 'HH:mm')}</Text>
              </TouchableOpacity>
              {showFormTimePicker && (
                <DateTimePickerModal
                  isVisible
                  mode="time"
                  onConfirm={(t) => {
                    setValue('time', t);
                    setShowFormTimePicker(false);
                  }}
                  onCancel={() => setShowFormTimePicker(false)}
                />
              )}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalActionButton}
                  onPress={handleSubmit(onSubmit)}
                >
                  <Text style={styles.modalActionText}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalActionButton, { backgroundColor: '#E53935' }]}
                  onPress={() => {
                    reset();
                    setAddModalVisible(false);
                  }}
                >
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
                onDayPress={(d) => {
                  setSelectedDate(new Date(d.timestamp));
                  setCalendarModalVisible(false);
                }}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalActionButton, { backgroundColor: '#E53935' }]}
                  onPress={() => setCalendarModalVisible(false)}
                >
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
              {filterOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => setTempFilter(opt)}
                  style={[
                    styles.filterOption,
                    tempFilter === opt && styles.filterOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      tempFilter === opt && styles.filterOptionTextActive,
                    ]}
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalActionButton}
                  onPress={() => {
                    setFilter(tempFilter);
                    setFilterModalVisible(false);
                  }}
                >
                  <Text style={styles.modalActionText}>Apply</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalActionButton, { backgroundColor: '#E53935' }]}
                  onPress={() => setFilterModalVisible(false)}
                >
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
              <Text style={styles.profileText}>
                Total Tasks Today:{' '}
                {tasks.filter((t) => isSameDay(new Date(t.dueDate), selectedDate)).length}
              </Text>
              <Text style={styles.profileText}>
                Completed:{' '}
                {tasks.filter(
                  (t) => isSameDay(new Date(t.dueDate), selectedDate) && t.status === 'done'
                ).length}
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalActionButton, { backgroundColor: '#E53935' }]}
                  onPress={() => setProfileModalVisible(false)}
                >
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
  header: { paddingVertical: 20, alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  headerDate: { fontSize: 16, color: '#444', marginTop: 4 },
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
  taskRow: { flexDirection: 'row', alignItems: 'center' },
  checkboxIcon: { marginRight: 12 },
  taskText: { fontSize: 18, color: '#333', flex: 1 },
  taskCompleted: { textDecorationLine: 'line-through', color: '#999' },
  taskTime: { fontSize: 14, color: '#999', marginTop: 8, textAlign: 'right' },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  navButton: { padding: 10 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: '#E53935',
    minWidth: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  plusWrapper: { position: 'absolute', bottom: 130, alignSelf: 'center' },
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
  bigModal: {
    width: '90%',
    height: '80%',
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

  label: { fontSize: 16, marginBottom: 4, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
  },
  picker: { height: 50, width: '100%' },
  timePickerButton: {
    borderWidth: 1,
    borderColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  timePickerText: { fontSize: 16, color: '#2196F3' },

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
  modalActionText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  calendarModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
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
  filterOptionActive: { borderColor: '#F57C00', backgroundColor: '#FFF8E1' },
  filterOptionText: { fontSize: 16, color: '#2196F3' },
  filterOptionTextActive: { color: '#F57C00', fontWeight: 'bold' },

  profileText: { fontSize: 18, color: '#333', marginVertical: 4 },
  priorityIcon: { marginLeft: 8 },
});
