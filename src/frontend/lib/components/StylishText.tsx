import { type MantineSize, Text } from '@mantine/core';
import type { JSX } from 'react';

// The AIO brand gradient (coral -> mauve -> violet), matching the login screen.
const BRAND_GRADIENT =
  'linear-gradient(120deg, #f9694e 0%, #b974a1 55%, #8a73cb 100%)';

// A stylish heading that uses the AIO brand gradient
export function StylishText({
  children,
  size
}: Readonly<{
  children: JSX.Element | string;
  size?: MantineSize;
}>) {
  return (
    <Text
      fw={700}
      size={size ?? 'xl'}
      style={{
        backgroundImage: BRAND_GRADIENT,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        width: 'fit-content'
      }}
    >
      {children}
    </Text>
  );
}
