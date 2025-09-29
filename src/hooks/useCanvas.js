
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
      canvas.instance?.dispose();
    } else {
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

      const fabric = new fabricJS.Canvas(element, options);
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
      dispatch(saveState());
      dispatch(updateObjects());
      
      // If this was a layer change, ensure objects are updated
      if (event.target && event.target.canvas) {
        dispatch(updateObjects());
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

    window.addEventListener('mousedown', clickAwayListener);

    return () => {
      window.removeEventListener('mousedown', clickAwayListener);
    };
  }, [canvas.instance, clickAwayListener, dispatch]);

  return [canvas, ref];
}
