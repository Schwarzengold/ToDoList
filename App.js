import React, { useEffect, useState } from 'react'
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import { Ionicons, Feather } from '@expo/vector-icons'
import { Calendar } from 'react-native-calendars'
import { format, isSameDay } from 'date-fns'
import { useForm, Controller } from 'react-hook-form'
import { Picker } from '@react-native-picker/picker'
import { db } from './db/client.native'
import { tasks } from './db/schema'
import { eq, and, like } from 'drizzle-orm/expo-sqlite'

export default function App() {
  const [todos, setTodos] = useState([])
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [filter, setFilter] = useState('all')
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [tempFilter, setTempFilter] = useState('all')
  const [calendarModalVisible, setCalendarModalVisible] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const { control, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      title: '',
      date: new Date(),
      time: new Date(),
      priority: 'low',
    },
  })
  const formDate = watch('date')
  const formTime = watch('time')

  const safeFormat = (d, fmt) => {
    const date = new Date(d)
    return isNaN(date) ? '' : format(date, fmt)
  }

  const loadTodos = async () => {
    const result = await db.select().from(tasks)
    setTodos(result)
  }

  useEffect(() => {
    loadTodos()
  }, [])

  const onSubmit = async data => {
    await db.insert(tasks).values({
      title: data.title,
      date: data.date.toISOString(),
      time: data.time.toISOString(),
      priority: data.priority,
      status: 'to-do',
    })
    reset()
    setAddModalVisible(false)
    loadTodos()
  }

  const toggleTask = async id => {
    const task = todos.find(t => t.id === id)
    const next = task.status === 'to-do' ? 'done' : 'to-do'
    await db.update(tasks).set({ status: next }).where(eq(tasks.id, id))
    loadTodos()
  }

  const deleteDone = async () => {
    const key = format(selectedDate, 'yyyy-MM-dd')
    await db.delete(tasks).where(
      and(
        like(tasks.date, `${key}%`),
        eq(tasks.status, 'done')
      )
    )
    loadTodos()
  }

  const getMarked = () => {
    const m = {}
    todos.forEach(t => {
      const d = format(new Date(t.date), 'yyyy-MM-dd')
      m[d] = { marked: true, dotColor: '#50cebb' }
    })
    const sel = format(selectedDate, 'yyyy-MM-dd')
    m[sel] = { ...(m[sel] || {}), selected: true, selectedColor: '#2196F3' }
    return m
  }

  const filtered = todos.filter(t => {
    if (!isSameDay(new Date(t.date), selectedDate)) return false
    if (filter === 'active') return t.status === 'to-do'
    if (filter === 'completed') return t.status === 'done'
    if (['low', 'medium', 'high'].includes(filter)) return t.priority === filter
    return true
  })

  const getStyle = p => ({
    borderLeftColor:
      p === 'low' ? '#4CAF50' : p === 'medium' ? '#FF9800' : '#F44336',
    borderLeftWidth: 5,
  })

  const getIcon = p => {
    if (p === 'low')
      return <Ionicons name="arrow-down-circle" size={20} color="#4CAF50" />
    if (p === 'medium')
      return <Ionicons name="alert-circle" size={20} color="#FF9800" />
    if (p === 'high')
      return <Ionicons name="warning" size={20} color="#F44336" />
    return null
  }

  return (
    <LinearGradient colors={['#FCE38A','#F38181']} style={{flex:1}}>
      <SafeAreaView style={{flex:1}}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ToDo List</Text>
          <Text style={styles.headerDate}>{safeFormat(selectedDate,'do MMMM yyyy')}</Text>
        </View>
        <FlatList
          data={filtered}
          keyExtractor={i=>i.id+''}
          renderItem={({item})=>(
            <TouchableOpacity
              style={[styles.taskCard,getStyle(item.priority)]}
              onPress={()=>toggleTask(item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.taskCardHeader}>
                <Text style={styles.taskTitle}>{item.title}</Text>
                {getIcon(item.priority)}
              </View>
              <Text style={styles.taskTime}>{safeFormat(item.time,'HH:mm')}</Text>
            </TouchableOpacity>
          )}
        />
        <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
          <Feather name="plus" size={24} color="#fff" />
        </TouchableOpacity>
        <Modal visible={addModalVisible} animationType="slide">
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Task</Text>
            <Controller control={control} name="title" render={({ field: { onChange, value } }) => (
              <TextInput style={styles.input} placeholder="Title" onChangeText={onChange} value={value} />
            )} />
            <Controller control={control} name="priority" render={({ field: { onChange, value } }) => (
              <Picker selectedValue={value} onValueChange={onChange} style={styles.input}>
                <Picker.Item label="Low" value="low" />
                <Picker.Item label="Medium" value="medium" />
                <Picker.Item label="High" value="high" />
              </Picker>
            )} />
            <View style={styles.datetimeRow}>
              <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <Text style={styles.datetimeButton}>Select Date: {safeFormat(formDate, 'dd.MM.yyyy')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowTimePicker(true)}>
                <Text style={styles.datetimeButton}>Select Time: {safeFormat(formTime, 'HH:mm')}</Text>
              </TouchableOpacity>
            </View>
            <DateTimePickerModal
              isVisible={showDatePicker}
              mode="date"
              onConfirm={date => {
                setValue('date', date)
                setShowDatePicker(false)
              }}
              onCancel={() => setShowDatePicker(false)}
            />
            <DateTimePickerModal
              isVisible={showTimePicker}
              mode="time"
              onConfirm={time => {
                setValue('time', time)
                setShowTimePicker(false)
              }}
              onCancel={() => setShowTimePicker(false)}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={handleSubmit(onSubmit)} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setAddModalVisible(false)} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: 20,
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
  taskRow: { flexDirection: 'row', alignItems: 'center' },
  taskText: { fontSize: 18, color: '#333', flex: 1 },
  taskCompleted: { textDecorationLine: 'line-through', color: '#999' },
  taskTime: { fontSize: 14, color: '#999', marginTop: 8, textAlign: 'right' },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0, right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  plusWrapper: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    zIndex: 10,
  },
  plusButton: {
    backgroundColor: '#2196F3',
    width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    width: '85%', backgroundColor: '#fff',
    borderRadius: 12, padding: 20,
    shadowColor: '#000', shadowOpacity: 0.25,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22, fontWeight: 'bold',
    marginBottom: 12, color: '#333', textAlign: 'center',
  },
  input: {
    borderWidth: 1, borderColor: '#ddd',
    borderRadius: 8, padding: 12,
    fontSize: 16, marginBottom: 12, color: '#333',
  },
  label: { fontSize: 16, marginBottom: 4, color: '#333' },
  timePickerButton: {
    borderWidth: 1, borderColor: '#2196F3',
    borderRadius: 8, padding: 12, marginBottom: 12,
    alignItems: 'center',
  },
  timePickerText: { fontSize: 16, color: '#2196F3' },
  pickerWrapper: {
    borderWidth: 1, borderColor: '#ddd',
    borderRadius: 8, marginBottom: 12,
  },
  picker: { height: 50, width: '100%' },
  modalButtons: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 12,
  },
  modalActionButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10, paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalActionText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  filterModal: {
    width: '85%', backgroundColor: '#fff',
    borderRadius: 12, padding: 20,
    shadowColor: '#000', shadowOpacity: 0.25,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  filterOption: {
    width: '100%', paddingVertical: 10,
    marginVertical: 4, borderRadius: 8,
    borderWidth: 1, borderColor: '#bbb',
    paddingHorizontal: 12,
  },
  filterOptionActive: {
    borderColor: '#F57C00', backgroundColor: '#FFF8E1',
  },
  filterOptionText: { fontSize: 16, color: '#2196F3' },
  filterOptionTextActive: { color: '#F57C00', fontWeight: 'bold' },
  calendarModal: {
    width: '85%', backgroundColor: '#fff',
    borderRadius: 12, padding: 10, alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.25,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
})
