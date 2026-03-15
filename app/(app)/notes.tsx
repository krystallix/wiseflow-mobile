import { Box } from '@/components/ui/box';
import { Center } from '@/components/ui/center';
import { Text } from '@/components/ui/text';
import React from 'react';

export default function Notes() {
  return (
    <Box className="flex-1 bg-background">
      <Center className="flex-1 gap-5">
        <Text className="font-semibold text-2xl">
          ini adalah notes app
        </Text>
      </Center>
    </Box>
  );
}
