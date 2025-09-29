
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
        targetFindTolerance: 10,
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
      } else {
        // Clicked on an object - it will be selected automatically by Fabric.js
        // The selection:created or selection:updated event will handle the dispatch
      }
    };

    canvas.instance.on('object:modified', handleObjectModified);
    canvas.instance.on('object:scaling', handleObjectScaling);
    canvas.instance.on('selection:created', handleSelectionCreated);
    canvas.instance.on('selection:updated', handleSelectionUpdated);
    canvas.instance.on('selection:cleared', handleSelectionCleared);
    canvas.instance.on('mouse:down', handleMouseDown);

    window.addEventListener('mousedown', clickAwayListener);

    return () => {
      window.removeEventListener('mousedown', clickAwayListener);
    };
  }, [canvas.instance, clickAwayListener, dispatch]);

  return [canvas, ref];
}
