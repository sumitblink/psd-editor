
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loadFromTemplate } from './canvasSlice';

const initialState = {
  active: null,
  status: 'uninitialized'
};

export const initializeTemplate = createAsyncThunk(
  'template/initializeTemplate',
  async (template, { dispatch }) => {
    await dispatch(loadFromTemplate(template));
    return template;
  }
);

const templateSlice = createSlice({
  name: 'template',
  initialState,
  reducers: {
    setActive: (state, action) => {
      state.active = action.payload;
    },
    setStatus: (state, action) => {
      state.status = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeTemplate.pending, (state) => {
        state.status = 'pending';
      })
      .addCase(initializeTemplate.fulfilled, (state, action) => {
        state.active = action.payload;
        state.status = 'success';
      })
      .addCase(initializeTemplate.rejected, (state) => {
        state.status = 'error';
      });
  }
});

export const { setActive, setStatus } = templateSlice.actions;

// Selectors
export const selectTemplate = (state) => state.template;
export const selectActiveTemplate = (state) => state.template.active;
export const selectIsLoading = (state) => state.template.status === 'pending';

export default templateSlice.reducer;
