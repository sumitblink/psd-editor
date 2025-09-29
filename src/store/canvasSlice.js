
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { exportedProps, maxUndoRedoSteps, originalHeight, originalWidth } from '../config/app';
import { defaultFont, defaultFontSize } from '../config/fonts';
import { brandLogoKey, mainTextKey, subTextKey } from '../constants/keys';
import { addFontFace } from '../functions/fonts';
import { objectID } from '../functions/nanoid';
import { createFactory, toFixed } from '../functions/utils';
import { fabric as fabricJS } from 'fabric';

const initialState = {
  instance: null,
  objects: [],
  template: null,
  selected: null,
  clipboard: null,
  width: 0,
  height: 0,
  background: null,
  actionsEnabled: true,
  undoStack: [],
  redoStack: []
};

// Async thunks for generator functions
export const loadFromTemplate = createAsyncThunk(
  'canvas/loadFromTemplate',
  async (template, { getState, dispatch }) => {
    const { canvas } = getState();
    if (!canvas.instance) return;

    const factorY = originalHeight / canvas.height;
    const factorX = originalWidth / canvas.width;

    dispatch(changeBackground(template));
    dispatch(changeDimensions({ height: template.height * factorY, width: template.width * factorX }));

    const processedElements = [];

    for (const element of template.state) {
      const isDuplicate = canvas.instance
        .getObjects()
        .some((object) => object.name?.toLowerCase() === element.name?.toLowerCase());

      const name = isDuplicate ? objectID(element.name.toLowerCase()) : element.name.toLowerCase();

      switch (element.type) {
        case 'textbox':
          const fontRes = await addFontFace(element.details.fontFamily || defaultFont);
          if (fontRes.error) {
            console.log('Error', fontRes.error);
          }

          const textbox = new fabricJS.Textbox(element.value, {
            ...element.details,
            name,
            fontFamily: fontRes.name,
          });

          textbox.set('meta', intializeMetaProperties(textbox, canvas.instance));
          canvas.instance.add(textbox);
          break;

        case 'image':
          const image = await new Promise((resolve) => {
            fabricJS.Image.fromURL(element.value, (img) => resolve(img), {
              ...element.details,
              name,
              objectCaching: true,
              crossOrigin: 'anonymous',
            });
          });
          image.set('meta', intializeMetaProperties(image, canvas.instance));
          canvas.instance.add(image);
          break;
      }

      canvas.instance.fire('object:modified', { target: null });
      canvas.instance.renderAll();
    }

    return template;
  }
);

export const loadFromJSON = createAsyncThunk(
  'canvas/loadFromJSON',
  async (state, { getState, dispatch }) => {
    const { canvas } = getState();
    if (!canvas.instance) return;

    const active = canvas.selected ? canvas.selected.name : false;
    canvas.instance.clear();
    
    await new Promise((resolve) => {
      canvas.instance.loadFromJSON(state, () => resolve(state));
    });

    if (active) {
      const elements = canvas.instance.getObjects();
      for (const element of elements) {
        if (element.name === active) {
          canvas.instance.setActiveObject(element);
          break;
        }
      }
    }

    dispatch(updateObjects());
    canvas.instance.renderAll();
    return state;
  }
);

export const changeImageSource = createAsyncThunk(
  'canvas/changeImageSource',
  async (source, { getState }) => {
    const { canvas } = getState();
    if (!canvas.instance) return;

    const image = canvas.instance.getActiveObject();
    if (!image) return;

    const width = image.width * image.scaleX;
    const height = image.height * image.scaleY;

    await new Promise((resolve) => {
      image.setSrc(source, () => {
        resolve(image);
      });
    });

    const scaleX = width / image.width;
    const scaleY = height / image.height;

    image.set('scaleX', scaleX).set('scaleY', scaleY);
    canvas.instance.fire('object:modified', { target: image }).renderAll();
    
    return source;
  }
);

export const changeFontFamily = createAsyncThunk(
  'canvas/changeFontFamily',
  async (fontFamily = defaultFont, { getState }) => {
    const { canvas } = getState();
    if (!canvas.instance) return;

    const res = await addFontFace(fontFamily);
    if (res.error) {
      console.log('Error', res.error);
    }

    const text = canvas.instance.getActiveObject();
    if (!text) return;

    text.set('fontFamily', res.name);
    canvas.instance.fire('object:modified', { target: text }).renderAll();
    
    return res.name;
  }
);

export const addText = createAsyncThunk(
  'canvas/addText',
  async ({ text = 'Sample Text', options = { fill: '#0000000', fontSize: defaultFontSize } }, { getState, dispatch }) => {
    const { canvas } = getState();
    if (!canvas.instance) return;

    const res = await addFontFace(defaultFont);
    if (res.error) {
      console.log('Error', res.error);
    }

    const textbox = new fabricJS.Textbox(text, {
      name: objectID('text'),
      fontFamily: res.name,
      fill: options.fill,
      fontSize: options.fontSize,
      width: 310,
    });

    canvas.instance.add(textbox);
    canvas.instance.viewportCenterObject(textbox);
    canvas.instance.setActiveObject(textbox);

    dispatch(updateObjects());
    canvas.instance.fire('object:modified', { target: textbox }).renderAll();
    
    return textbox.toObject(exportedProps);
  }
);

export const addImage = createAsyncThunk(
  'canvas/addImage',
  async ({ source, options = { width: 500, height: 500 } }, { getState, dispatch }) => {
    const { canvas } = getState();
    if (!canvas.instance) return;

    const image = await new Promise((resolve) => {
      fabricJS.Image.fromURL(source, (image) => resolve(image), { 
        name: objectID('image'), 
        objectCaching: true 
      });
    });

    image.scaleToHeight(options.height);
    image.scaleToWidth(options.width);

    canvas.instance.add(image);
    canvas.instance.viewportCenterObject(image);
    canvas.instance.setActiveObject(image);

    dispatch(updateObjects());
    canvas.instance.fire('object:modified', { target: image }).renderAll();
    
    return image.toObject(exportedProps);
  }
);

const intializeMetaProperties = (object, instance) => {
  const multiplier = instance?.getZoom() || 1;

  switch (object.name) {
    case mainTextKey:
    case subTextKey:
      const text = object;
      return {
        max_width: toFixed(text.width ? text.width * multiplier : 0, 0),
        max_height: toFixed(text.height ? text.height * multiplier : 0, 0),
        max_number_words: text.text?.split(' ').length || 20,
        max_number_characters: text.text?.length || 60,
        wrap_length: text.textLines.length ? Math.max(...text.textLines.map((line) => line.length)) : 15,
      };
    case brandLogoKey:
      const image = object;
      return {
        max_width: toFixed(image.getScaledWidth() ? image.getScaledWidth() * multiplier : 0, 0),
        max_height: toFixed(image.getScaledHeight() ? image.getScaledHeight() * multiplier : 0, 0),
      };
    default:
      return {};
  }
};

const canvasSlice = createSlice({
  name: 'canvas',
  initialState,
  reducers: {
    setInstance: (state, action) => {
      state.instance = action.payload;
      state.height = action.payload.height;
      state.width = action.payload.width;
    },
    updateObjects: (state) => {
      if (!state.instance) return;
      const objects = state.instance.getObjects();
      state.objects = objects
        .map((object) => object.toObject(exportedProps))
        .map((object, index) => ({ name: object.name, type: object.type, index }));
      state.selected = state.instance.getActiveObject()?.toObject(exportedProps);
    },
    updateBackground: (state, action) => {
      state.background = action.payload;
    },
    updateDimensions: (state) => {
      if (!state.instance) return;
      state.width = state.instance.width;
      state.height = state.instance.height;
    },
    changeBackground: (state, action) => {
      const { background, source } = action.payload;
      if (!state.instance) return;

      switch (background) {
        case 'color':
          state.instance.setBackgroundColor(source, state.instance.renderAll.bind(state.instance));
          break;
        case 'image':
          state.instance.setBackgroundImage(source, state.instance.renderAll.bind(state.instance));
          break;
      }

      state.background = { type: background, source };
    },
    changeDimensions: (state, action) => {
      const { width, height } = action.payload;
      if (!state.instance) return;

      if (width) state.instance.setWidth(+width).renderAll();
      if (height) state.instance.setHeight(+height).renderAll();

      state.width = state.instance.width;
      state.height = state.instance.height;
    },
    changeObjectDimensions: (state, action) => {
      const { property, value } = action.payload;
      if (!state.instance) return;

      const element = state.instance.getActiveObject();
      if (!element) return;

      const type = element.type;

      switch (type) {
        case 'textbox':
          if (property === 'height') return;
          element.set(property, value);
          break;
        case 'image':
          const scale = property === 'height' ? value / element.height : value / element.width;
          const key = property === 'height' ? 'scaleY' : 'scaleX';
          element.set(key, scale);
          break;
        case 'rect':
          element.set(property, value);
          break;
      }

      state.instance.fire('object:modified', { target: element }).renderAll();
    },
    changeImageProperty: (state, action) => {
      const { property, value } = action.payload;
      if (!state.instance) return;

      const image = state.instance.getActiveObject();
      if (!image) return;

      image.set(property, value);
      state.instance.fire('object:modified', { target: image }).renderAll();
    },
    changeTextProperty: (state, action) => {
      const { property, value } = action.payload;
      if (!state.instance) return;

      const text = state.instance.getActiveObject();
      if (!text) return;

      text.set(property, value);
      state.instance.fire('object:modified', { target: text }).renderAll();
    },
    selectObject: (state, action) => {
      if (!state.instance) return;
      const element = state.instance.getActiveObject();
      state.selected = element?.toObject(exportedProps);
    },
    deselectObject: (state) => {
      state.selected = null;
    },
    saveState: (state) => {
      if (!state.instance) return;

      state.redoStack = [];
      const canvasState = state.instance.toObject(exportedProps);
      const element = state.instance.getActiveObject();

      if (element) {
        state.selected = element.toObject(exportedProps);
      }

      if (state.undoStack.length < maxUndoRedoSteps) {
        state.undoStack.push(canvasState);
      } else {
        state.undoStack.splice(0, 1);
        state.undoStack.push(canvasState);
      }
    },
    scaleObject: (state, action) => {
      const { target } = action.payload;
      if (!state.instance) return;

      if (target.type === 'textbox') {
        const text = target;
        text.set({
          fontSize: Math.round(text.fontSize * target.scaleY),
          width: target.width * target.scaleX,
          scaleX: 1,
          scaleY: 1,
        });
      }

      state.instance.renderAll();
    },
    changeObjectLayer: (state, action) => {
      const layer = action.payload;
      if (!state.instance) return;

      const element = state.instance.getActiveObject();
      if (!element) return;

      switch (layer) {
        case 'back':
          element.sendToBack();
          break;
        case 'backward':
          element.sendBackwards();
          break;
        case 'forward':
          element.bringForward();
          break;
        case 'front':
          element.bringToFront();
          break;
        default:
          element.moveTo(layer);
          break;
      }

      const objects = state.instance.getObjects();
      state.objects = objects
        .map((object) => object.toObject(exportedProps))
        .map((object, index) => ({ name: object.name, type: object.type, index }));
      
      state.instance.fire('object:modified', { target: element }).renderAll();
    },
    deleteObject: (state) => {
      if (!state.instance) return;

      const elements = state.instance.getActiveObjects();
      if (!elements) return;

      for (const element of elements) {
        state.instance.remove(element);
      }

      const objects = state.instance.getObjects();
      state.objects = objects
        .map((object) => object.toObject(exportedProps))
        .map((object, index) => ({ name: object.name, type: object.type, index }));

      state.instance.fire('object:modified', { target: null }).renderAll();
    },
    setActionsEnabled: (state, action) => {
      state.actionsEnabled = action.payload;
    },
    setTemplate: (state, action) => {
      state.template = action.payload;
    },
    clearCanvas: (state) => {
      state.objects = [];
      state.redoStack = [];
      state.undoStack = [];
      state.selected = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadFromTemplate.fulfilled, (state, action) => {
        state.template = action.payload;
      })
      .addCase(loadFromJSON.fulfilled, (state) => {
        state.actionsEnabled = true;
      });
  }
});

export const {
  setInstance,
  updateObjects,
  updateBackground,
  updateDimensions,
  changeBackground,
  changeDimensions,
  changeObjectDimensions,
  changeImageProperty,
  changeTextProperty,
  selectObject,
  deselectObject,
  saveState,
  scaleObject,
  changeObjectLayer,
  deleteObject,
  setActionsEnabled,
  setTemplate,
  clearCanvas
} = canvasSlice.actions;

// Selectors
export const selectCanvas = (state) => state.canvas;
export const selectCanvasInstance = (state) => state.canvas.instance;
export const selectObjects = (state) => state.canvas.objects;
export const selectSelected = (state) => state.canvas.selected;
export const selectDimensions = (state) => ({ height: state.canvas.height, width: state.canvas.width });
export const selectCanUndo = (state) => state.canvas.actionsEnabled && state.canvas.undoStack.length > 1;
export const selectCanRedo = (state) => state.canvas.actionsEnabled && state.canvas.redoStack.length > 0;

export default canvasSlice.reducer;
