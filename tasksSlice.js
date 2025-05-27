import { createSlice } from '@reduxjs/toolkit';
import { isSameDay } from 'date-fns';

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: [],
  reducers: {
    addTask(state, action) {
      state.push(action.payload);
    },
    toggleTask(state, action) {
      const t = state.find(i => i.id === action.payload);
      if (t) t.status = t.status === 'to-do' ? 'done' : 'to-do';
    },
    removeTask(state, action) {
      return state.filter(t => t.id !== action.payload);
    },
    removeDoneForDate(state, action) {
      const target = action.payload;
      return state.filter(
        t => !(isSameDay(new Date(t.dueDate), target) && t.status === 'done')
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

export const selectTasks = s => s.tasks;
export const selectUnfinishedCount = s =>
  s.tasks.filter(t => t.status === 'to-do').length;
