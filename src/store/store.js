
import { configureStore } from '@reduxjs/toolkit';
import canvasReducer from './canvasSlice';
import templateReducer from './templateSlice';

export const store = configureStore({
  reducer: {
    canvas: canvasReducer,
    template: templateReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['canvas/setInstance'],
        ignoredPaths: ['canvas.instance'],
      },
    }),
});

export default store;
