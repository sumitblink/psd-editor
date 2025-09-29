import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, VStack, Text, HStack, IconButton, Button, ButtonGroup } from '@chakra-ui/react';
import { EyeIcon, EyeOffIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, MoveUpIcon, MoveDownIcon, GripVerticalIcon } from 'lucide-react';
import { Drawer, Item } from '../container';
import { selectObjects, selectSelected, selectCanvasInstance, deleteObject, changeObjectLayer, selectObject } from '../../store/canvasSlice';

const LayerSidebar = () => {
  const dispatch = useDispatch();
  const objects = useSelector(selectObjects);
  const selected = useSelector(selectSelected);
  const canvas = useSelector(selectCanvasInstance);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);

  const handleDeleteObject = () => {
    dispatch(deleteObject());
  };

  const handleLayerMove = (direction) => {
    if (!canvas || !selected) return;
    dispatch(changeObjectLayer(direction));
  };

  const handleSelectLayer = (layerName) => {
    if (!canvas) return;

    const canvasObjects = canvas.getObjects();
    const targetObject = canvasObjects.find(obj => obj.name === layerName);

    if (targetObject) {
      canvas.setActiveObject(targetObject);
      canvas.renderAll();
      dispatch(selectObject());
    }
  };

  const handleLayerHover = (layerName, isHovering) => {
    if (!canvas) return;

    const canvasObjects = canvas.getObjects();
    const targetObject = canvasObjects.find(obj => obj.name === layerName);

    if (targetObject && targetObject !== canvas.getActiveObject()) {
      if (isHovering) {
        // Add hover effect
        targetObject.set({
          stroke: '#3182ce',
          strokeWidth: 2,
          strokeDashArray: [5, 5]
        });
      } else {
        // Remove hover effect
        targetObject.set({
          stroke: null,
          strokeWidth: 0,
          strokeDashArray: null
        });
      }
      canvas.renderAll();
    }
  };

  const toggleLayerVisibility = (layerName) => {
    if (!canvas) return;

    const canvasObjects = canvas.getObjects();
    const targetObject = canvasObjects.find(obj => obj.name === layerName);

    if (targetObject) {
      targetObject.set('visible', !targetObject.visible);
      canvas.renderAll();
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, object) => {
    setDraggedItem(object);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  };

  const handleDragOver = (e, object) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(object);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = (e, targetObject) => {
    e.preventDefault();
    setDragOverItem(null);
    
    if (!draggedItem || !targetObject || !canvas) return;
    if (draggedItem.name === targetObject.name) return;

    // Find the canvas objects
    const canvasObjects = canvas.getObjects();
    const draggedCanvasObj = canvasObjects.find(obj => obj.name === draggedItem.name);
    const targetCanvasObj = canvasObjects.find(obj => obj.name === targetObject.name);

    if (!draggedCanvasObj || !targetCanvasObj) return;

    // Get current indices
    const draggedIndex = canvasObjects.indexOf(draggedCanvasObj);
    const targetIndex = canvasObjects.indexOf(targetCanvasObj);

    // Move the dragged object to the target position
    draggedCanvasObj.moveTo(targetIndex);
    
    // Select the moved object
    canvas.setActiveObject(draggedCanvasObj);
    canvas.renderAll();
    dispatch(selectObject());

    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  // Debug: Log objects to console
  console.log('LayerSidebar objects:', objects);
  console.log('LayerSidebar selected:', selected);

  return (
    <Drawer>
      <Box p={4} borderBottom="1px solid" borderColor="gray.200" bg="white">
        <Text fontSize="lg" fontWeight="semibold">
          Layers ({objects.length})
        </Text>
        {selected && (
          <Box mt={2}>
            <Text fontSize="xs" color="gray.500" mb={2}>Layer Controls:</Text>
            <ButtonGroup size="xs" spacing={1} flexWrap="wrap">
              <Button onClick={() => handleLayerMove('front')} leftIcon={<MoveUpIcon size={10} />}>
                Front
              </Button>
              <Button onClick={() => handleLayerMove('forward')} leftIcon={<ArrowUpIcon size={10} />}>
                Up
              </Button>
              <Button onClick={() => handleLayerMove('backward')} leftIcon={<ArrowDownIcon size={10} />}>
                Down
              </Button>
              <Button onClick={() => handleLayerMove('back')} leftIcon={<MoveDownIcon size={10} />}>
                Back
              </Button>
            </ButtonGroup>
          </Box>
        )}
      </Box>
      <Box flex={1} overflowY="auto" bg="white">
        <VStack spacing={1} p={2} align="stretch">
          {[...objects].reverse().map((object, index) => (
            <Item
              key={`${object.name}-${object.index}-${index}`}
              width="full"
              bg={
                dragOverItem?.name === object.name 
                  ? "blue.50" 
                  : selected?.name === object.name 
                  ? "blue.100" 
                  : "white"
              }
              border="2px solid"
              borderColor={
                dragOverItem?.name === object.name
                  ? "blue.400"
                  : selected?.name === object.name 
                  ? "blue.300" 
                  : "gray.200"
              }
              cursor="pointer"
              onClick={() => handleSelectLayer(object.name)}
              onMouseEnter={() => handleLayerHover(object.name, true)}
              onMouseLeave={() => handleLayerHover(object.name, false)}
              _hover={{ bg: dragOverItem?.name === object.name ? "blue.50" : "gray.50" }}
              p={2}
              borderRadius="md"
              draggable="true"
              onDragStart={(e) => handleDragStart(e, object)}
              onDragOver={(e) => handleDragOver(e, object)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, object)}
              onDragEnd={handleDragEnd}
              opacity={draggedItem?.name === object.name ? 0.5 : 1}
              transform={draggedItem?.name === object.name ? "rotate(5deg)" : "none"}
              transition="all 0.2s"
            >
              <HStack flex={1} spacing={2}>
                <IconButton
                  size="xs"
                  variant="ghost"
                  icon={<GripVerticalIcon size={12} />}
                  aria-label="Drag to reorder"
                  color="gray.400"
                  cursor="grab"
                  _active={{ cursor: "grabbing" }}
                  onMouseDown={(e) => e.stopPropagation()}
                />
                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                    {object.name || `Layer ${index + 1}`}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {object.type} • Layer {object.index}
                  </Text>
                </Box>
                <HStack spacing={1}>
                  <IconButton
                    size="xs"
                    variant="ghost"
                    icon={<EyeIcon size={12} />}
                    aria-label="Toggle visibility"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerVisibility(object.name);
                    }}
                  />
                  <IconButton
                    size="xs"
                    variant="ghost"
                    icon={<TrashIcon size={12} />}
                    aria-label="Delete layer"
                    colorScheme="red"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectLayer(object.name);
                      setTimeout(() => handleDeleteObject(), 100);
                    }}
                  />
                </HStack>
              </HStack>
            </Item>
          ))}
          {objects.length === 0 && (
            <Box p={4} textAlign="center" bg="gray.50" borderRadius="md">
              <Text fontSize="sm" color="gray.500" mb={2}>
                No layers yet.
              </Text>
              <Text fontSize="xs" color="gray.400">
                Import a PSD file to get started.
              </Text>
            </Box>
          )}
        </VStack>
      </Box>
    </Drawer>
  );
};

export default LayerSidebar;