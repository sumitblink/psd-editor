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
          canvas.instance.off();
          canvas.instance.dispose();
          console.log('Canvas element removed and disposed');
        } catch (error) {
          console.warn('Canvas cleanup error:', error);
        }
      }
    } else if (!canvas.instance && element.id === 'canvas') {
      console.log('Initializing canvas on element:', element);
      const options = {
        width: originalWidth,
        height: originalHeight,
        preserveObjectStacking: true,
        backgroundColor: 'white',
        selection: true,
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

      try {
        const fabric = new fabricJS.Canvas(element, options);
        console.log('Canvas created:', fabric);
        dispatch(setInstance(fabric));

        // Load state from localStorage
        const savedState = localStorage.getItem('canvasState');
        if (savedState) {
          try {
            const parsedState = JSON.parse(savedState);
            
            // Check if state contains blob URLs (which become invalid on refresh)
            const hasInvalidBlobs = JSON.stringify(parsedState).includes('blob:');
            
            if (hasInvalidBlobs) {
              console.log('Saved state contains invalid blob URLs, clearing...');
              localStorage.removeItem('canvasState');
              localStorage.removeItem('templateData');
              fabric.renderAll();
              dispatch(updateObjects());
            } else {
              fabric.loadFromJSON(parsedState, () => {
                fabric.renderAll();
                dispatch(updateObjects());
                console.log('Canvas state loaded from localStorage');
              });
            }
          } catch (error) {
            console.warn('Error loading saved state:', error);
            localStorage.removeItem('canvasState');
            fabric.renderAll();
            dispatch(updateObjects());
          }
        } else {
          // Immediate render if no saved state
          fabric.renderAll();
          console.log('Canvas rendered');
        }

        props?.onInitialize?.(fabric);
      } catch (error) {
        console.error('Canvas initialization error:', error);
      }
    }
  }, [dispatch, props, canvas.instance]);

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
        dispatch(saveState());
        dispatch(updateObjects());

        // Save to localStorage on every modification
        try {
          const canvasState = canvas.instance.toJSON();
          localStorage.setItem('canvasState', JSON.stringify(canvasState));
          console.log('Canvas state saved to localStorage');
        } catch (error) {
          console.warn('Failed to save canvas state:', error);
        }

        // If this was a layer change, ensure objects are updated
        if (event.target && event.target.canvas) {
          dispatch(updateObjects());
        }
      } catch (error) {
        console.warn('Object modified handler error:', error);
      }
    };
    const handleObjectScaling = (event) => dispatch(scaleObject(event));
    const handleSelectionCreated = () => {
      dispatch(selectObject());
      dispatch(updateObjects());
    };
    const handleSelectionUpdated = () => {
      dispatch(selectObject());
      dispatch(updateObjects());
    };
    const handleSelectionCleared = () => {
      dispatch(deselectObject());
      dispatch(updateObjects());
    };
    const handleMouseDown = (event) => {
      if (!event.target) {
        // Clicked on empty canvas area - deselect all
        dispatch(deselectObject());
        canvas.instance.discardActiveObject().renderAll();
      }
      // Don't interfere with object selection - let Fabric.js handle it naturally
    };

    const handleObjectMoving = (event) => {
      // Prevent other objects from being selected during move
      const activeObject = canvas.instance.getActiveObject();
      if (activeObject && event.target === activeObject) {
        // Ensure the moving object stays selected
        dispatch(selectObject());
      }
    };

    const handleMouseOver = (event) => {
      if (event.target && event.target !== canvas.instance.getActiveObject()) {
        // Show hover effect - add a subtle border
        event.target.set({
          stroke: '#3182ce',
          strokeWidth: 2,
          strokeDashArray: [5, 5]
        });
        canvas.instance.renderAll();

        // Change cursor to pointer
        canvas.instance.defaultCursor = 'pointer';
        canvas.instance.hoverCursor = 'pointer';
      }
    };

    const handleMouseOut = (event) => {
      if (event.target && event.target !== canvas.instance.getActiveObject()) {
        // Remove hover effect
        event.target.set({
          stroke: null,
          strokeWidth: 0,
          strokeDashArray: null
        });
        canvas.instance.renderAll();

        // Reset cursor
        canvas.instance.defaultCursor = 'default';
        canvas.instance.hoverCursor = 'move';
      }
    };

    const handlePathCreated = () => {
      dispatch(updateObjects());
    };
    
    const handleObjectAdded = () => {
      dispatch(updateObjects());
      // Save to localStorage when object is added
      try {
        const canvasState = canvas.instance.toJSON();
        localStorage.setItem('canvasState', JSON.stringify(canvasState));
        console.log('Canvas state saved to localStorage');
      } catch (error) {
        console.warn('Failed to save canvas state:', error);
      }
    };

    const handleObjectRemoved = () => {
      dispatch(updateObjects());
      // Save to localStorage when object is removed
      try {
        const canvasState = canvas.instance.toJSON();
        localStorage.setItem('canvasState', JSON.stringify(canvasState));
        console.log('Canvas state saved to localStorage');
      } catch (error) {
        console.warn('Failed to save canvas state:', error);
      }
    };

    canvas.instance.on('object:modified', handleObjectModified);
    canvas.instance.on('object:scaling', handleObjectScaling);
    canvas.instance.on('object:moving', handleObjectMoving);
    canvas.instance.on('selection:created', handleSelectionCreated);
    canvas.instance.on('selection:updated', handleSelectionUpdated);
    canvas.instance.on('selection:cleared', handleSelectionCleared);
    canvas.instance.on('mouse:down', handleMouseDown);
    canvas.instance.on('mouse:over', handleMouseOver);
    canvas.instance.on('mouse:out', handleMouseOut);
    canvas.instance.on('path:created', handlePathCreated);
    canvas.instance.on('object:added', handleObjectAdded);
    canvas.instance.on('object:removed', handleObjectRemoved);


    window.addEventListener('mousedown', clickAwayListener);

    return () => {
      window.removeEventListener('mousedown', clickAwayListener);
    };
  }, [canvas.instance, clickAwayListener, dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (canvas.instance) {
        // Save state before disposing
        try {
          const canvasState = canvas.instance.toJSON();
          localStorage.setItem('canvasState', JSON.stringify(canvasState));
          console.log('Canvas state saved to localStorage on unmount');
        } catch (error) {
          console.warn('Failed to save canvas state on unmount:', error);
        }
        try {
          canvas.instance.off();
          canvas.instance.clear();
          canvas.instance.dispose();
        } catch (error) {
          console.warn('Canvas unmount cleanup error:', error);
        }
      }
    };
  }, [canvas.instance]);

  return [canvas, ref];
}