import { createSlice, nanoid } from '@reduxjs/toolkit';
import { isSameDay } from 'date-fns';

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: [],
  reducers: {
    addTask: {
      prepare({ title, date, time, priority, dueDate, notificationId }) {
        return {
          payload: {
            id: nanoid(),
            text: title,
            dueDate,
            priority,
            status: 'to-do',
            notificationId: notificationId || null,
          },
        };
      },
      reducer(state, action) {
        state.push(action.payload);
      },
    },
    toggleTask(state, action) {
      const task = state.find((t) => t.id === action.payload);
      if (task) task.status = task.status === 'to-do' ? 'done' : 'to-do';
    },
    removeTask(state, action) {
      return state.filter((t) => t.id !== action.payload);
    },
    setNotificationId(state, action) {
      const { task, notificationId } = action.payload;
      const t = state.find((item) => item.text === task.title && item.dueDate === task.dueDate);
      if (t) t.notificationId = notificationId;
    },
    removeNotificationId(state, action) {
      const task = state.find((t) => t.id === action.payload);
      if (task) task.notificationId = null;
    },
  },
});

export const {
  addTask,
  toggleTask,
  removeTask,
  setNotificationId,
  removeNotificationId,
} = tasksSlice.actions;

export default tasksSlice.reducer;

export const selectTasks = (state) => state.tasks;
export const selectUnfinishedCount = (state) =>
  state.tasks.filter((t) => t.status === 'to-do').length;
