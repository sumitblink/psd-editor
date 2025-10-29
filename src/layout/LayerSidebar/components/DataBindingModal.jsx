
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
  Textarea,
} from '@chakra-ui/react';
import { Link2, Unlink } from 'lucide-react';

const DataBindingModal = ({ isOpen, onClose, layerName, layerType, currentBinding, onSave, onClear }) => {
  const [selectedKey, setSelectedKey] = useState(currentBinding || '');
  const toast = useToast();

  // Available API keys for suggestions
  const availableKeys = layerType === 'image' 
    ? ['image_url', 'additional_image_urls.0', 'additional_image_urls.1']
    : ['name', 'price', 'offer', 'availability', 'id'];

  const handleSave = () => {
    if (selectedKey && selectedKey.trim()) {
      onSave(layerName, selectedKey.trim());
      toast({
        title: 'Data binding saved',
        description: layerType === 'textbox' 
          ? `Template will be applied from layer content`
          : `Layer "${layerName}" is now bound to "${selectedKey}"`,
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

  const insertPlaceholder = (key) => {
    setSelectedKey(prev => prev + `{{${key}}}`);
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

            {layerType === 'textbox' ? (
              <>
                <Box>
                  <Text fontSize="sm" fontWeight="bold" mb={2}>
                    Template Text
                  </Text>
                  <Textarea
                    value={selectedKey}
                    onChange={(e) => setSelectedKey(e.target.value)}
                    placeholder="Enter text with {{placeholders}}, e.g., {{offer}} OFF on {{name}}"
                    rows={4}
                    fontSize="sm"
                  />
                  <Text fontSize="xs" color="gray.500" mt={2}>
                    Use double curly braces like <code>{'{{offer}}'}</code> to insert dynamic values.
                    This will be saved as the layer's binding template.
                  </Text>
                </Box>

                <Box>
                  <Text fontSize="xs" fontWeight="bold" mb={2} color="gray.600">
                    Quick Insert:
                  </Text>
                  <HStack wrap="wrap" spacing={2}>
                    {availableKeys.map((key) => (
                      <Button
                        key={key}
                        size="xs"
                        variant="outline"
                        onClick={() => insertPlaceholder(key)}
                      >
                        {key}
                      </Button>
                    ))}
                  </HStack>
                </Box>
              </>
            ) : (
              <Box>
                <Text fontSize="sm" fontWeight="bold" mb={2}>
                  Select API Response Key
                </Text>
                <Select
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                  placeholder="Choose a key to bind"
                >
                  <option value="">No binding</option>
                  {availableKeys.map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </Select>
                <Text fontSize="xs" color="gray.500" mt={2}>
                  This layer will display images from the selected API field
                </Text>
              </Box>
            )}

            {currentBinding && (
              <Box p={3} bg="blue.50" borderRadius="md">
                <Text fontSize="xs" fontWeight="bold" color="blue.700">
                  Current Binding:
                </Text>
                <Text fontSize="sm" color="blue.600" whiteSpace="pre-wrap">
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
