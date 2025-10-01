import { originalHeight, originalWidth } from '../../config/app';
import { Header } from '../../layout/Header';
import { LayerSidebar } from '../../layout/LayerSidebar';
import PropertySidebar from '../../layout/PropertySidebar/PropertySidebar';
import { CanvasContainer, Layout, Loader, MainContainer, MainWrapperContainer } from '../../layout/container';
import { useCanvas } from '../../hooks/useCanvas';
import { useSelector, useDispatch } from 'react-redux';
import { selectIsLoading, selectActiveTemplate } from '../../store/templateSlice';
import { selectSelected, undo, redo, deleteObject } from '../../store/canvasSlice';
import { Box } from '@chakra-ui/react';
import { useEffect } from 'react';

function CreateTemplate() {
  const dispatch = useDispatch();
  const isLoading = useSelector(selectIsLoading);
  const activeTemplate = useSelector(selectActiveTemplate);
  const selected = useSelector(selectSelected);

  const [canvas, ref] = useCanvas();

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'z':
            event.preventDefault();
            if (event.shiftKey) {
              dispatch(redo());
            } else {
              dispatch(undo());
            }
            break;
          case 'y':
            event.preventDefault();
            dispatch(redo());
            break;
        }
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        if (selected) {
          dispatch(deleteObject());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, selected]);

  const propertyKey = selected?.name ?? activeTemplate?.key;

  return (
    <Box display="flex">
      <Layout>
        <Header />
        <MainWrapperContainer>
          <LayerSidebar />
          <MainContainer>
            <Box 
              height="600px" 
              width="800px" 
              position="relative"
              display="flex"
              alignItems="center"
              justifyContent="center"
              overflow="auto"
              sx={{
                '&::-webkit-scrollbar': {
                  width: '8px',
                  height: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#888',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: '#555',
                },
              }}
            >
              <CanvasContainer
                height={originalHeight}
                width={originalWidth}
              >
                <canvas 
                  id="canvas" 
                  ref={ref} 
                  style={{ 
                    display: 'block',
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    maxWidth: 'none',
                    maxHeight: 'none'
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