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

  dataBindings: {}, // Maps layer names to API response keys

  background: null,
  actionsEnabled: true,
  undoStack: [],
  redoStack: []
};

// Async thunks for generator functions
export const loadFromTemplate = createAsyncThunk(
  'canvas/loadFromTemplate',
  async (template, { getState, dispatch }) => {
    const state = getState();
    const canvas = state.canvas;
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
            selectable: true,
            evented: true,
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
              selectable: true,
              evented: true,
            });
          });
          image.set('meta', intializeMetaProperties(image, canvas.instance));
          canvas.instance.add(image);
          break;
      }

      canvas.instance.fire('object:modified', { target: null });
      canvas.instance.renderAll();
    }

    // Update objects list after loading template
    const objects = canvas.instance.getObjects();
    const updatedObjects = objects
      .map((object, index) => ({ 
        name: object.name || `Layer ${index + 1}`, 
        type: object.type, 
        index,
        visible: object.visible !== false
      }));

    return { template, objects: updatedObjects };
  }
);

export const loadFromJSON = createAsyncThunk(
  'canvas/loadFromJSON',
  async (jsonState, { getState, dispatch }) => {
    const currentState = getState();
    const canvas = currentState.canvas;
    if (!canvas.instance) return;

    const active = canvas.selected ? canvas.selected.name : false;
    canvas.instance.clear();

    await new Promise((resolve) => {
      canvas.instance.loadFromJSON(jsonState, () => resolve(jsonState));
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
    return jsonState;
  }
);

export const changeImageSource = createAsyncThunk(
  'canvas/changeImageSource',
  async (source, { getState }) => {
    const state = getState();
    const canvas = state.canvas;
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
    const state = getState();
    const canvas = state.canvas;
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
  async ({ text = 'Sample Text', options = { fill: '#000000', fontSize: defaultFontSize } }, { getState, dispatch }) => {
    const state = getState();
    const canvas = state.canvas;
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
      selectable: true,
      evented: true,
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
    const state = getState();
    const canvas = state.canvas;
    if (!canvas.instance) return;

    const image = await new Promise((resolve) => {
      fabricJS.Image.fromURL(source, (image) => resolve(image), { 
        name: objectID('image'), 
        objectCaching: true,
        selectable: true,
        evented: true
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

export const addRectangle = createAsyncThunk(
  'canvas/addRectangle',
  async ({ options = { width: 200, height: 150, fill: '#3182ce' } }, { getState, dispatch }) => {
    const state = getState();
    const canvas = state.canvas;
    if (!canvas.instance) return;

    const rect = new fabricJS.Rect({
      name: objectID('rectangle'),
      width: options.width,
      height: options.height,
      fill: options.fill,
      selectable: true,
      evented: true,
    });

    canvas.instance.add(rect);
    canvas.instance.viewportCenterObject(rect);
    canvas.instance.setActiveObject(rect);

    dispatch(updateObjects());
    canvas.instance.fire('object:modified', { target: rect }).renderAll();

    return rect.toObject(exportedProps);
  }
);

export const addCircle = createAsyncThunk(
  'canvas/addCircle',
  async ({ options = { radius: 75, fill: '#38a169' } }, { getState, dispatch }) => {
    const state = getState();
    const canvas = state.canvas;
    if (!canvas.instance) return;

    const circle = new fabricJS.Circle({
      name: objectID('circle'),
      radius: options.radius,
      fill: options.fill,
      selectable: true,
      evented: true,
    });

    canvas.instance.add(circle);
    canvas.instance.viewportCenterObject(circle);
    canvas.instance.setActiveObject(circle);

    dispatch(updateObjects());
    canvas.instance.fire('object:modified', { target: circle }).renderAll();

    return circle.toObject(exportedProps);
  }
);

export const addTriangle = createAsyncThunk(
  'canvas/addTriangle',
  async ({ options = { width: 150, height: 150, fill: '#d69e2e' } }, { getState, dispatch }) => {
    const state = getState();
    const canvas = state.canvas;
    if (!canvas.instance) return;

    const triangle = new fabricJS.Triangle({
      name: objectID('triangle'),
      width: options.width,
      height: options.height,
      fill: options.fill,
      selectable: true,
      evented: true,
    });

    canvas.instance.add(triangle);
    canvas.instance.viewportCenterObject(triangle);
    canvas.instance.setActiveObject(triangle);

    dispatch(updateObjects());
    canvas.instance.fire('object:modified', { target: triangle }).renderAll();

    return triangle.toObject(exportedProps);
  }
);

export const copyObject = createAsyncThunk(
  'canvas/copyObject',
  async (_, { getState, dispatch }) => {
    const state = getState();
    const canvas = state.canvas;
    if (!canvas.instance) return;

    const activeObject = canvas.instance.getActiveObject();
    if (!activeObject) return;

    // Clone the object asynchronously and store in clipboard
    const cloned = await new Promise((resolve) => {
      activeObject.clone((clonedObj) => {
        resolve(clonedObj.toObject(exportedProps));
      }, exportedProps);
    });

    dispatch(setClipboard(cloned));
    return cloned;
  }
);

export const cutObject = createAsyncThunk(
  'canvas/cutObject',
  async (_, { getState, dispatch }) => {
    const state = getState();
    const canvas = state.canvas;
    if (!canvas.instance) return;

    const activeObject = canvas.instance.getActiveObject();
    if (!activeObject) return;

    // Clone the object asynchronously and store in clipboard
    const cloned = await new Promise((resolve) => {
      activeObject.clone((clonedObj) => {
        resolve(clonedObj.toObject(exportedProps));
      }, exportedProps);
    });

    dispatch(setClipboard(cloned));

    // Remove the object
    canvas.instance.remove(activeObject);
    canvas.instance.discardActiveObject();

    dispatch(updateObjects());
    canvas.instance.fire('object:modified', { target: null }).renderAll();

    return cloned;
  }
);

export const pasteObject = createAsyncThunk(
  'canvas/pasteObject',
  async (_, { getState, dispatch }) => {
    const state = getState();
    const canvas = state.canvas;
    if (!canvas.instance || !canvas.clipboard) return;

    const clipboardData = canvas.clipboard;

    let pastedObject = null;

    if (clipboardData.type === 'textbox') {
      pastedObject = new fabricJS.Textbox(clipboardData.text, {
        ...clipboardData,
        left: clipboardData.left + 20,
        top: clipboardData.top + 20,
        name: objectID(clipboardData.name || 'text')
      });

      canvas.instance.add(pastedObject);
      canvas.instance.setActiveObject(pastedObject);
    } else if (clipboardData.type === 'image') {
      pastedObject = await new Promise((resolve) => {
        fabricJS.Image.fromURL(clipboardData.src, (img) => {
          img.set({
            ...clipboardData,
            left: clipboardData.left + 20,
            top: clipboardData.top + 20,
            name: objectID(clipboardData.name || 'image')
          });
          resolve(img);
        });
      });

      canvas.instance.add(pastedObject);
      canvas.instance.setActiveObject(pastedObject);
    } else if (clipboardData.type === 'rect') {
      pastedObject = new fabricJS.Rect({
        ...clipboardData,
        left: clipboardData.left + 20,
        top: clipboardData.top + 20,
        name: objectID(clipboardData.name || 'rect')
      });

      canvas.instance.add(pastedObject);
      canvas.instance.setActiveObject(pastedObject);
    } else if (clipboardData.type === 'circle') {
      pastedObject = new fabricJS.Circle({
        ...clipboardData,
        left: clipboardData.left + 20,
        top: clipboardData.top + 20,
        name: objectID(clipboardData.name || 'circle')
      });

      canvas.instance.add(pastedObject);
      canvas.instance.setActiveObject(pastedObject);
    } else if (clipboardData.type === 'triangle') {
      pastedObject = new fabricJS.Triangle({
        ...clipboardData,
        left: clipboardData.left + 20,
        top: clipboardData.top + 20,
        name: objectID(clipboardData.name || 'triangle')
      });

      canvas.instance.add(pastedObject);
      canvas.instance.setActiveObject(pastedObject);
    }

    dispatch(updateObjects());
    canvas.instance.fire('object:modified', { target: pastedObject }).renderAll();

    return pastedObject ? pastedObject.toObject(exportedProps) : null;
  }
);

export const changeTextProperty = createAsyncThunk(
  'canvas/changeTextProperty',
  async ({ property, value }, { getState, dispatch }) => {
    const state = getState();
    const canvas = state.canvas;
    if (!canvas.instance) return;

    const text = canvas.instance.getActiveObject();
    if (!text) return;

    text.set(property, value);
    canvas.instance.fire('object:modified', { target: text }).renderAll();

    dispatch(selectObject());
  }
);

export const changeImageProperty = createAsyncThunk(
  'canvas/changeImageProperty',
  async ({ property, value }, { getState, dispatch }) => {
    const state = getState();
    const canvas = state.canvas;
    if (!canvas.instance) return;

    const image = canvas.instance.getActiveObject();
    if (!image) return;

    image.set(property, value);
    canvas.instance.fire('object:modified', { target: image }).renderAll();

    dispatch(selectObject());
  }
);

export const changeObjectDimensions = createAsyncThunk(
  'canvas/changeObjectDimensions',
  async ({ property, value }, { getState, dispatch }) => {
    const state = getState();
    const canvas = state.canvas;
    if (!canvas.instance) return;

    const element = canvas.instance.getActiveObject();
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
      case 'circle':
      case 'triangle':
        element.set(property, value);
        break;
    }

    canvas.instance.fire('object:modified', { target: element }).renderAll();

    dispatch(selectObject());
  }
);

export const applyDataBindings = createAsyncThunk(
  'canvas/applyDataBindings',
  async (data, { getState, dispatch }) => {
    const state = getState();
    const canvas = state.canvas;
    const bindings = state.canvas.dataBindings;

    if (!canvas.instance || Object.keys(bindings).length === 0) return;

    console.log('Applying data bindings:', bindings);
    console.log('Data received:', data);

    const canvasObjects = canvas.instance.getObjects();

    for (const [layerName, apiKey] of Object.entries(bindings)) {
      const targetObject = canvasObjects.find(obj => obj.name === layerName);

      if (!targetObject) continue;

      // Navigate through nested properties (e.g., "additional_image_urls.0")
      const keys = apiKey.split('.');
      let value = data;

      for (const key of keys) {
        if (value && typeof value === 'object') {
          value = value[key];
        } else {
          value = undefined;
          break;
        }
      }

      if (value === undefined) continue;

      // Update based on object type
      if (targetObject.type === 'textbox' || targetObject.type === 'text') {
        // For text objects, replace template variables or set text directly
        let newText = targetObject.text || '';

        // Check if the text contains template variables like {{offer}}
        const templateRegex = /\{\{(\w+)\}\}/g;
        const matches = newText.match(templateRegex);

        if (matches) {
          // Replace all template variables
          matches.forEach(match => {
            const key = match.replace(/\{\{|\}\}/g, '');
            if (data[key] !== undefined) {
              newText = newText.replace(match, data[key]);
              console.log(`Replaced ${match} with ${data[key]} in ${layerName}`);
            }
          });
        } else {
          // No template variables, set value directly
          newText = String(value);
        }

        targetObject.set('text', newText);
      } else if (targetObject.type === 'image') {
        // For image objects, load the new image URL while preserving position and scale
        console.log(`Updating ${layerName} (image) with value from ${apiKey}:`, value);

        // Store original properties before loading new image
        const originalProps = {
          left: targetObject.left,
          top: targetObject.top,
          scaleX: targetObject.scaleX,
          scaleY: targetObject.scaleY,
          angle: targetObject.angle,
          originX: targetObject.originX,
          originY: targetObject.originY,
          flipX: targetObject.flipX,
          flipY: targetObject.flipY,
          opacity: targetObject.opacity,
          shadow: targetObject.shadow,
          stroke: targetObject.stroke,
          strokeWidth: targetObject.strokeWidth
        };

        fabricJS.Image.fromURL(value, (img) => {
          if (img) {
            targetObject.setElement(img.getElement());
            // Restore all original properties
            targetObject.set(originalProps);
            canvas.instance.renderAll();
          } else {
            console.error(`Error loading ${value}`);
          }
        }, { crossOrigin: 'anonymous' });
      }
    }

    canvas.instance.renderAll();
    dispatch(updateObjects());
  }
);

export const undoAction = createAsyncThunk(
  'canvas/undoAction',
  async (_, { getState, dispatch }) => {
    const state = getState();
    const canvas = state.canvas;

    if (canvas.undoStack.length === 0 || !canvas.instance) return;

    const currentState = canvas.instance.toObject(exportedProps);

    // Get previous state
    const previousState = canvas.undoStack[canvas.undoStack.length - 1];

    // Load the previous state
    await new Promise((resolve) => {
      canvas.instance.loadFromJSON(previousState, () => {
        canvas.instance.renderAll();
        resolve();
      });
    });

    // Update UI state after loading
    dispatch(updateObjects());
    dispatch(selectObject());

    // Update the stacks after successful load
    return { currentState, previousState };
  }
);

export const redoAction = createAsyncThunk(
  'canvas/redoAction',
  async (_, { getState, dispatch }) => {
    const state = getState();
    const canvas = state.canvas;

    if (canvas.redoStack.length === 0 || !canvas.instance) return;

    const currentState = canvas.instance.toObject(exportedProps);

    // Get next state
    const nextState = canvas.redoStack[canvas.redoStack.length - 1];

    // Load the next state
    await new Promise((resolve) => {
      canvas.instance.loadFromJSON(nextState, () => {
        canvas.instance.renderAll();
        resolve();
      });
    });

    // Update UI state after loading
    dispatch(updateObjects());
    dispatch(selectObject());

    // Update the stacks after successful load
    return { currentState, nextState };
  }
);

export const toggleObjectLock = createAsyncThunk(
  'canvas/toggleObjectLock',
  async (layerName, { getState, dispatch }) => {
    const state = getState();
    const canvas = state.canvas;
    if (!canvas.instance) return;

    const canvasObjects = canvas.instance.getObjects();
    const targetObject = canvasObjects.find(obj => obj.name === layerName);

    if (targetObject) {
      const newLockState = !targetObject.lockMovementX;

      // Lock or unlock the object
      targetObject.set({
        lockMovementX: newLockState,
        lockMovementY: newLockState,
        lockScalingX: newLockState,
        lockScalingY: newLockState,
        lockRotation: newLockState,
        selectable: !newLockState,
        evented: !newLockState,
        hasControls: !newLockState,
        hasBorders: !newLockState,
        hoverCursor: newLockState ? 'default' : 'move'
      });

      // If locking, deselect the object
      if (newLockState && canvas.instance.getActiveObject() === targetObject) {
        canvas.instance.discardActiveObject();
        dispatch(selectObject());
      }

      canvas.instance.renderAll();
      dispatch(updateObjects());

      return { layerName, locked: newLockState };
    }
  }
);

export const duplicateObject = createAsyncThunk(
  'canvas/duplicateObject',
  async (_, { getState, dispatch }) => {
    const state = getState();
    const canvas = state.canvas;
    if (!canvas.instance) return;

    const activeObject = canvas.instance.getActiveObject();
    if (!activeObject) return;

    // Clone the object asynchronously
    const cloned = await new Promise((resolve) => {
      activeObject.clone((clonedObj) => {
        clonedObj.set({
          left: clonedObj.left + 20,
          top: clonedObj.top + 20,
          name: objectID(clonedObj.name || activeObject.type)
        });
        resolve(clonedObj);
      }, exportedProps);
    });

    canvas.instance.add(cloned);
    canvas.instance.setActiveObject(cloned);
    canvas.instance.fire('object:modified', { target: cloned }).renderAll();

    dispatch(updateObjects());
    dispatch(selectObject());

    return cloned.toObject(exportedProps);
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
        .map((object, index) => ({ 
          name: object.name || `Layer ${index + 1}`, 
          type: object.type, 
          index,
          visible: object.visible !== false,
          locked: object.lockMovementX === true
        }));
      const activeObject = state.instance.getActiveObject();
      state.selected = activeObject ? activeObject.toObject(exportedProps) : null;
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

      // Force immediate update of objects list with correct order and indices
      const objects = state.instance.getObjects();
      state.objects = objects
        .map((object, index) => ({ 
          name: object.name || `Layer ${index + 1}`, 
          type: object.type, 
          index,
          visible: object.visible !== false
        }));

      // Update selected object to maintain selection after layer change
      const activeObject = state.instance.getActiveObject();
      state.selected = activeObject ? activeObject.toObject(exportedProps) : null;

      state.instance.fire('object:modified', { target: element }).renderAll();

      // Force state update to trigger re-render
      state.objects = [...state.objects];
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
      if (state.instance) {
        state.instance.clear();
        state.objects = [];
        state.selected = null;
      }
    },
    setClipboard: (state, action) => {
      state.clipboard = action.payload;
    },
    setLayerDataBinding: (state, action) => {
      const { layerName, apiKey } = action.payload;
      if (apiKey) {
        state.dataBindings[layerName] = apiKey;
      } else {
        delete state.dataBindings[layerName];
      }
    },
    clearLayerDataBinding: (state, action) => {
      const layerName = action.payload;
      delete state.dataBindings[layerName];
    },
    applyDataToLayers: (state, action) => {
      const data = action.payload;
      // This will be handled by async thunk
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadFromTemplate.fulfilled, (state, action) => {
        state.template = action.payload;
      })
      .addCase(loadFromJSON.fulfilled, (state) => {
        state.actionsEnabled = true;
      })
      .addCase(undoAction.pending, (state) => {
        state.actionsEnabled = false;
      })
      .addCase(undoAction.fulfilled, (state, action) => {
        if (action.payload) {
          state.redoStack.push(action.payload.currentState);
          if (state.redoStack.length > maxUndoRedoSteps) {
            state.redoStack.shift();
          }
          state.undoStack.pop();

          // Update objects list and selection
          if (state.instance) {
            const objects = state.instance.getObjects();
            state.objects = objects
              .map((object, index) => ({ 
                name: object.name || `Layer ${index + 1}`, 
                type: object.type, 
                index,
                visible: object.visible !== false,
                locked: object.lockMovementX === true
              }));

            const activeObject = state.instance.getActiveObject();
            state.selected = activeObject ? activeObject.toObject(exportedProps) : null;
          }
        }
        state.actionsEnabled = true;
      })
      .addCase(redoAction.pending, (state) => {
        state.actionsEnabled = false;
      })
      .addCase(redoAction.fulfilled, (state, action) => {
        if (action.payload) {
          state.undoStack.push(action.payload.currentState);
          if (state.undoStack.length > maxUndoRedoSteps) {
            state.undoStack.shift();
          }
          state.redoStack.pop();

          // Update objects list and selection
          if (state.instance) {
            const objects = state.instance.getObjects();
            state.objects = objects
              .map((object, index) => ({ 
                name: object.name || `Layer ${index + 1}`, 
                type: object.type, 
                index,
                visible: object.visible !== false,
                locked: object.lockMovementX === true
              }));

            const activeObject = state.instance.getActiveObject();
            state.selected = activeObject ? activeObject.toObject(exportedProps) : null;
          }
        }
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
  selectObject,
  deselectObject,
  saveState,
  scaleObject,
  changeObjectLayer,
  deleteObject,
  setActionsEnabled,
  setTemplate,
  clearCanvas,
  setClipboard,
  setLayerDataBinding,
  clearLayerDataBinding,
  applyDataToLayers
} = canvasSlice.actions;

// Selectors
export const selectCanvas = (state) => state.canvas;
export const selectCanvasInstance = (state) => state.canvas.instance;
export const selectObjects = (state) => state.canvas.objects;
export const selectSelected = (state) => state.canvas.selected;
export const selectCanUndo = (state) => state.canvas.undoStack.length > 0;
export const selectCanRedo = (state) => state.canvas.redoStack.length > 0;
export const selectDataBindings = (state) => state.canvas.dataBindings;

// Memoized selector to prevent unnecessary re-renders
import { createSelector } from '@reduxjs/toolkit';
export const selectDimensions = createSelector(
  [(state) => state.canvas.width, (state) => state.canvas.height],
  (width, height) => ({ width, height })
);

export default canvasSlice.reducer;