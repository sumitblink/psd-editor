
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fabric as fabricJS } from 'fabric';
import { originalWidth, originalHeight } from '../config/app';
import {
  setInstance,
  selectObject,
  deselectObject,
  saveState,
  scaleObject,
  selectCanvas,
  updateObjects
} from '../store/canvasSlice';

export function useCanvas(props) {
  const dispatch = useDispatch();
  const canvas = useSelector(selectCanvas);

  const ref = useCallback((element) => {
    if (!element) {
      if (canvas.instance) {
        try {
          canvas.instance.dispose();
          console.log('Canvas disposed successfully');
        } catch (error) {
          console.warn('Canvas cleanup error:', error);
        }
      }
    } else {
      const options = {
        width: originalWidth,
        height: originalHeight,
        preserveObjectStacking: true,
        backgroundColor: 'white',
        selection: true, // Enable selection box for multi-select
        selectionBorderColor: '#3182ce',
        selectionLineWidth: 2,
        selectionColor: 'rgba(49, 130, 206, 0.1)',
        centredRotation: true,
        interactive: true,
        selectable: true,
        evented: true,
        targetFindTolerance: 5,
        perPixelTargetFind: true,
        stopContextMenu: true,
        hoverCursor: 'pointer',
        moveCursor: 'move',
      };

      const fabric = new fabricJS.Canvas(element, options);
      
      // Configure selection border style - 5px solid
      fabricJS.Object.prototype.borderColor = '#3182ce';
      fabricJS.Object.prototype.borderScaleFactor = 5;
      fabricJS.Object.prototype.borderDashArray = null; // Remove dashed line
      fabricJS.Object.prototype.cornerColor = '#3182ce';
      fabricJS.Object.prototype.cornerStrokeColor = '#ffffff';
      fabricJS.Object.prototype.transparentCorners = false;
      
      dispatch(setInstance(fabric));
      props?.onInitialize?.(fabric);
    }
  }, [dispatch, props]);

  const clickAwayListener = useCallback(
    (event) => {
      if (!canvas.instance) return;

      const target = event.target;
      if (target.id !== 'canvas-container') return;

      dispatch(deselectObject());
      canvas.instance.discardActiveObject().renderAll();
    },
    [canvas.instance, dispatch]
  );

  useEffect(() => {
    if (!canvas.instance) return;

    canvas.instance.off();

    const handleObjectModified = (event) => {
      try {
        // Only save state for meaningful modifications, not during continuous operations
        // Save state only when modification is complete (mouse up)
        if (event.target && !event.target.__isMoving && !event.target.__isScaling) {
          dispatch(saveState());
        }
        dispatch(updateObjects());
        
        // If this was a layer change, ensure objects are updated
        if (event.target && event.target.canvas) {
          dispatch(updateObjects());
        }
      } catch (error) {
        console.warn('Error in object modified handler:', error);
      }
    };
    const handleObjectScaling = (event) => {
      event.target.__isScaling = true;
      dispatch(scaleObject(event));
    };
    const handleSelectionCreated = () => {
      try {
        dispatch(selectObject());
        dispatch(updateObjects());
      } catch (error) {
        console.warn('Error in selection created handler:', error);
      }
    };
    const handleSelectionUpdated = () => {
      try {
        dispatch(selectObject());
        dispatch(updateObjects());
      } catch (error) {
        console.warn('Error in selection updated handler:', error);
      }
    };
    const handleSelectionCleared = () => {
      try {
        dispatch(deselectObject());
        dispatch(updateObjects());
      } catch (error) {
        console.warn('Error in selection cleared handler:', error);
      }
    };
    const handleMouseDown = (event) => {
      // Only deselect if clicking on truly empty canvas (not starting a selection box drag)
      if (!event.target && !event.e.shiftKey) {
        // Check if this is the start of a selection drag by checking mouse movement
        const isSelectionDrag = event.e.type === 'mousedown' && !event.e.ctrlKey;
        if (!isSelectionDrag) {
          dispatch(deselectObject());
          canvas.instance.discardActiveObject().renderAll();
        }
      }
    };

    const handleObjectMoving = (event) => {
      // Mark object as moving to prevent undo state save during drag
      event.target.__isMoving = true;
      const activeObject = canvas.instance.getActiveObject();
      if (activeObject && event.target === activeObject) {
        dispatch(selectObject());
      }
    };

    const handleMouseUp = (event) => {
      // Clear movement flags and save state after movement completes
      const objects = canvas.instance.getObjects();
      objects.forEach(obj => {
        if (obj.__isMoving || obj.__isScaling) {
          delete obj.__isMoving;
          delete obj.__isScaling;
          // Save state after movement/scaling is complete
          dispatch(saveState());
        }
      });
    };

    const handleMouseOver = (event) => {
      if (event.target && event.target !== canvas.instance.getActiveObject()) {
        const obj = event.target;
        
        // Cache original stroke properties if not already cached
        if (!obj._originalStroke) {
          obj._originalStroke = {
            stroke: obj.stroke,
            strokeWidth: obj.strokeWidth,
            strokeDashArray: obj.strokeDashArray
          };
        }
        
        // Show hover border on the canvas element
        obj.set({
          stroke: '#fbbf24', // Amber color for hover (different from selection)
          strokeWidth: 3,
          strokeDashArray: null
        });
        canvas.instance.renderAll();
        
        // Change cursor to pointer for hover feedback
        canvas.instance.defaultCursor = 'pointer';
        canvas.instance.hoverCursor = 'pointer';
      }
    };

    const handleMouseOut = (event) => {
      if (event.target && event.target !== canvas.instance.getActiveObject()) {
        const obj = event.target;
        
        // Restore original stroke properties
        if (obj._originalStroke) {
          obj.set({
            stroke: obj._originalStroke.stroke,
            strokeWidth: obj._originalStroke.strokeWidth,
            strokeDashArray: obj._originalStroke.strokeDashArray
          });
          delete obj._originalStroke; // Clean up cache
        }
        canvas.instance.renderAll();
        
        // Reset cursor
        canvas.instance.defaultCursor = 'default';
        canvas.instance.hoverCursor = 'move';
      }
    };

    const handlePathCreated = () => {
      dispatch(updateObjects());
    };

    canvas.instance.on('object:modified', handleObjectModified);
    canvas.instance.on('object:scaling', handleObjectScaling);
    canvas.instance.on('object:moving', handleObjectMoving);
    canvas.instance.on('selection:created', handleSelectionCreated);
    canvas.instance.on('selection:updated', handleSelectionUpdated);
    canvas.instance.on('selection:cleared', handleSelectionCleared);
    canvas.instance.on('mouse:down', handleMouseDown);
    canvas.instance.on('mouse:up', handleMouseUp);
    canvas.instance.on('mouse:over', handleMouseOver);
    canvas.instance.on('mouse:out', handleMouseOut);
    canvas.instance.on('path:created', handlePathCreated);

    window.addEventListener('mousedown', clickAwayListener);

    return () => {
      try {
        window.removeEventListener('mousedown', clickAwayListener);
        if (canvas.instance) {
          canvas.instance.off();
        }
      } catch (error) {
        console.warn('Error in canvas cleanup:', error);
      }
    };
  }, [canvas.instance, clickAwayListener, dispatch]);

  return [canvas, ref];
}
