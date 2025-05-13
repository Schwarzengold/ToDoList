import { createSlice, nanoid } from '@reduxjs/toolkit';
import { isSameDay } from 'date-fns';

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: [],
  reducers: {
    addTask: {
      prepare({ title, date, time, priority }) {
        return {
          payload: {
            id: nanoid(),
            text: title,
            dueDate: date,
            dueTime: time,
            priority,
            status: 'to-do',
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
    removeDoneForDate(state, action) {
      const target = action.payload;
      return state.filter(
        (t) => !(isSameDay(new Date(t.dueDate), target) && t.status === 'done')
      );
    },
  },
});

export const {
  addTask,
  toggleTask,
  removeTask,
  removeDoneForDate,
} = tasksSlice.actions;

export default tasksSlice.reducer;

export const selectTasks = (state) => state.tasks;
export const selectUnfinishedCount = (state) =>
  state.tasks.filter((t) => t.status === 'to-do').length;
