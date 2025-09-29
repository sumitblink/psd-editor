
import React from 'react';
import { Box, Button, HStack } from '@chakra-ui/react';
import { HeadBar, HeaderLogo } from '../container';

const Header = () => {
  return (
    <HeadBar>
      <HStack spacing={4}>
        <HeaderLogo src="/logo.jpeg" alt="Logo" />
        <Box fontSize="lg" fontWeight="bold">
          PSD Editor
        </Box>
      </HStack>
      <HStack spacing={2}>
        <Button size="sm" variant="outline">
          Export
        </Button>
        <Button size="sm" colorScheme="blue">
          Save
        </Button>
      </HStack>
    </HeadBar>
  );
};

export default Header;
