
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

    const handleObjectModified = () => dispatch(saveState());
    const handleObjectScaling = (event) => dispatch(scaleObject(event));
    const handleSelectionCreated = () => dispatch(selectObject());
    const handleSelectionUpdated = () => dispatch(selectObject());
    const handleSelectionCleared = () => dispatch(deselectObject());

    canvas.instance.on('object:modified', handleObjectModified);
    canvas.instance.on('object:scaling', handleObjectScaling);
    canvas.instance.on('selection:created', handleSelectionCreated);
    canvas.instance.on('selection:updated', handleSelectionUpdated);
    canvas.instance.on('selection:cleared', handleSelectionCleared);

    window.addEventListener('mousedown', clickAwayListener);

    return () => {
      window.removeEventListener('mousedown', clickAwayListener);
    };
  }, [canvas.instance, clickAwayListener, dispatch]);

  return [canvas, ref];
}
