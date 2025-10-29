
import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  Text,
  Select,
  HStack,
  Badge,
  Box,
  useToast,
} from '@chakra-ui/react';
import { Link2, Unlink } from 'lucide-react';

const DataBindingModal = ({ isOpen, onClose, layerName, layerType, currentBinding, onSave, onClear }) => {
  const [selectedKey, setSelectedKey] = useState(currentBinding || '');
  const toast = useToast();

  // Sample API keys based on layer type
  const getAvailableKeys = () => {
    if (layerType === 'image') {
      return [
        { value: '', label: 'No binding' },
        { value: 'image_url', label: 'image_url' },
        { value: 'additional_image_urls.0', label: 'additional_image_urls[0]' },
        { value: 'additional_image_urls.1', label: 'additional_image_urls[1]' },
      ];
    } else if (layerType === 'textbox') {
      return [
        { value: '', label: 'No binding' },
        { value: 'name', label: 'name' },
        { value: 'price', label: 'price' },
        { value: 'offer', label: 'offer' },
        { value: 'availability', label: 'availability' },
        { value: 'id', label: 'id' },
      ];
    }
    return [{ value: '', label: 'No binding' }];
  };

  const handleSave = () => {
    if (selectedKey) {
      onSave(layerName, selectedKey);
      toast({
        title: 'Data binding saved',
        description: `Layer "${layerName}" is now bound to "${selectedKey}"`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } else {
      onClear(layerName);
      toast({
        title: 'Data binding removed',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
    }
    onClose();
  };

  const handleClear = () => {
    setSelectedKey('');
    onClear(layerName);
    toast({
      title: 'Data binding removed',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <Link2 size={20} />
            <Text>Bind Data to Layer</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Box>
              <Text fontSize="sm" fontWeight="bold" mb={2}>
                Layer Information
              </Text>
              <HStack>
                <Badge colorScheme="blue">{layerName}</Badge>
                <Badge colorScheme="gray">{layerType}</Badge>
              </HStack>
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="bold" mb={2}>
                Select API Response Key
              </Text>
              <Select
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                placeholder="Choose a key to bind"
              >
                {getAvailableKeys().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <Text fontSize="xs" color="gray.500" mt={2}>
                {layerType === 'image'
                  ? 'This layer will display images from the selected API field'
                  : 'This layer will display text from the selected API field'}
              </Text>
            </Box>

            {currentBinding && (
              <Box p={3} bg="blue.50" borderRadius="md">
                <Text fontSize="xs" fontWeight="bold" color="blue.700">
                  Current Binding:
                </Text>
                <Text fontSize="sm" color="blue.600">
                  {currentBinding}
                </Text>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={2}>
            {currentBinding && (
              <Button
                leftIcon={<Unlink size={16} />}
                variant="ghost"
                colorScheme="red"
                onClick={handleClear}
              >
                Clear Binding
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSave}>
              Save Binding
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DataBindingModal;
