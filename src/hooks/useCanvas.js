
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
      // If clicking on empty canvas, handle click vs drag selection
      if (!event.target) {
        const startX = event.e.clientX;
        const startY = event.e.clientY;
        let isDragging = false;
        
        const onMouseMove = (e) => {
          const moved = Math.abs(e.clientX - startX) > 3 || Math.abs(e.clientY - startY) > 3;
          if (moved) {
            isDragging = true;
            cleanup();
          }
        };
        
        const onMouseUp = () => {
          if (!isDragging) {
            dispatch(deselectObject());
            canvas.instance.discardActiveObject().renderAll();
          }
          cleanup();
        };
        
        const cleanup = () => {
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        };
        
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      } else {
        // Check if the clicked object is already selected
        const isShiftPressed = event.e.shiftKey;
        const activeObject = canvas.instance.getActiveObject();
        const isAlreadySelected = activeObject === event.target || 
          (activeObject && activeObject.type === 'activeSelection' && activeObject.contains(event.target));
        
        // If the object is NOT already selected and NOT shift-clicking for multi-select
        // Disable its movability temporarily to allow selection box to work
        if (!isShiftPressed && !isAlreadySelected) {
          const originalEvented = event.target.evented;
          const originalSelectable = event.target.selectable;
          
          // Disable the object temporarily
          event.target.evented = false;
          event.target.selectable = false;
          
          const startX = event.e.clientX;
          const startY = event.e.clientY;
          let isDragging = false;
          
          const onMouseMove = (e) => {
            const moved = Math.abs(e.clientX - startX) > 3 || Math.abs(e.clientY - startY) > 3;
            if (moved) {
              isDragging = true;
            }
          };
          
          const onMouseUp = () => {
            // Restore object properties
            event.target.evented = originalEvented;
            event.target.selectable = originalSelectable;
            
            if (!isDragging) {
              // It was a click, select the object
              canvas.instance.setActiveObject(event.target);
              canvas.instance.renderAll();
              dispatch(selectObject());
            }
            
            cleanup();
          };
          
          const cleanup = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
          };
          
          window.addEventListener('mousemove', onMouseMove);
          window.addEventListener('mouseup', onMouseUp);
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
      // Clear movement flags and save state once if any object was modified
      const objects = canvas.instance.getObjects();
      let wasModified = false;
      
      objects.forEach(obj => {
        if (obj.__isMoving || obj.__isScaling) {
          delete obj.__isMoving;
          delete obj.__isScaling;
          wasModified = true;
        }
      });
      
      // Only save state once after all modifications complete
      if (wasModified) {
        dispatch(saveState());
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
