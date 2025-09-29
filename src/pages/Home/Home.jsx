
import { originalHeight, originalWidth } from '../../config/app';
import { Header } from '../../layout/Header';
import { LayerSidebar } from '../../layout/LayerSidebar';
import PropertySidebar from '../../layout/PropertySidebar/PropertySidebar';
import { CanvasContainer, Layout, Loader, MainContainer, MainWrapperContainer } from '../../layout/container';
import { useCanvas } from '../../hooks/useCanvas';
import { useSelector } from 'react-redux';
import { selectIsLoading, selectActiveTemplate } from '../../store/templateSlice';
import { selectDimensions, selectSelected } from '../../store/canvasSlice';
import { Box } from '@chakra-ui/react';
import { useEffect, useMemo, useRef, useState } from 'react';

function CreateTemplate() {
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

  const canvasDimensions = useMemo(() => {
    const canvasWidth = dimensions.width || originalWidth;
    const canvasHeight = dimensions.height || originalHeight;

    // Calculate scale to fit canvas in container with some padding
    const padding = 40; // 20px padding on each side
    const availableWidth = containerSize.width - padding;
    const availableHeight = containerSize.height - padding;

    const scaleX = availableWidth / canvasWidth;
    const scaleY = availableHeight / canvasHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 1

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
            <Box height={canvasDimensions.scaledHeight} width={canvasDimensions.scaledWidth} position="relative">
              <CanvasContainer 
                height={canvasDimensions.height} 
                width={canvasDimensions.width} 
                transform={`scale(${canvasDimensions.scale})`}
              >
                <canvas id="canvas" ref={ref} />
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

export const Home = CreateTemplate;
