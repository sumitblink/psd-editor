import { originalHeight, originalWidth } from '../../config/app';
import { Header } from '../../layout/Header';
import { LayerSidebar } from '../../layout/LayerSidebar';
import PropertySidebar from '../../layout/PropertySidebar/PropertySidebar';
import { CanvasContainer, Layout, Loader, MainContainer, MainWrapperContainer } from '../../layout/container';
import { useCanvas } from '../../hooks/useCanvas';
import { useSelector, useDispatch } from 'react-redux';
import { selectIsLoading, selectActiveTemplate } from '../../store/templateSlice';
import { selectDimensions, selectSelected, undo, redo, deleteObject } from '../../store/canvasSlice';
import { Box } from '@chakra-ui/react';
import { useEffect, useMemo, useRef, useState } from 'react';

function CreateTemplate() {
  const dispatch = useDispatch();
  const isLoading = useSelector(selectIsLoading);
  const activeTemplate = useSelector(selectActiveTemplate);
  const dimensions = useSelector(selectDimensions);
  const selected = useSelector(selectSelected);

  const [canvas, ref] = useCanvas();
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Measure container size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'z':
            event.preventDefault();
            if (event.shiftKey) {
              // Ctrl+Shift+Z for redo
              dispatch(redo());
            } else {
              // Ctrl+Z for undo
              dispatch(undo());
            }
            break;
          case 'y':
            // Ctrl+Y for redo (alternative)
            event.preventDefault();
            dispatch(redo());
            break;
        }
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        // Delete key for deleting selected object
        event.preventDefault();
        if (selected) {
          dispatch(deleteObject());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected]);

  const canvasDimensions = useMemo(() => {
    const canvasWidth = dimensions.width || originalWidth;
    const canvasHeight = dimensions.height || originalHeight;

    // Calculate scale to fit canvas in container with some padding
    const padding = 40; // 20px padding on each side
    const availableWidth = containerSize.width - padding;
    const availableHeight = containerSize.height - padding;

    const scaleX = availableWidth / canvasWidth;
    const scaleY = availableHeight / canvasHeight;
    const scale = Math.min(scaleX, scaleY, 0.8); // Allow scaling up to 80% and down as needed

    return {
      width: canvasWidth,
      height: canvasHeight,
      scaledWidth: canvasWidth * scale,
      scaledHeight: canvasHeight * scale,
      scale,
    };
  }, [dimensions, containerSize]);

  const propertyKey = selected?.name ?? activeTemplate?.key;

  return (
    <Box display={'flex'}>
      <Layout>
        <Header />
        <MainWrapperContainer>
          <LayerSidebar />
          <MainContainer id="canvas-container" ref={containerRef}>
            <Box 
              height={canvasDimensions.scaledHeight || 400} 
              width={canvasDimensions.scaledWidth || 600} 
              position="relative"
              minHeight="400px"
              minWidth="600px"
            >
              <CanvasContainer
                height={canvasDimensions.height || 400}
                width={canvasDimensions.width || 600}
                transform={`scale(${canvasDimensions.scale || 1})`}
              >
                <canvas 
                  id="canvas" 
                  ref={ref} 
                  style={{ 
                    display: 'block',
                    backgroundColor: 'white',
                    border: '1px solid #ccc'
                  }} 
                />
              </CanvasContainer>
            </Box>
          </MainContainer>
          <PropertySidebar key={propertyKey} />
        </MainWrapperContainer>
      </Layout>
      <Loader isLoading={isLoading} />
    </Box>
  );
}

export { CreateTemplate as Home };