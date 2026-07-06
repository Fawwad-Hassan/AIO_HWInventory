import { type MantineColorsTuple, createTheme } from '@mantine/core';
import { themeToVars } from '@mantine/vanilla-extract';

// AIO brand palette (see aioapp.com): a violet primary and a coral accent,
// on neutral near-black dark surfaces. The coral->violet gradient is reserved
// for the logo/brand mark only.

const aioViolet: MantineColorsTuple = [
  '#f2efff',
  '#e2dbfc',
  '#c6b4f8',
  '#a98cf4',
  '#9575f2',
  '#8a6cf2',
  '#7a5af0', // 6 - primary brand violet
  '#6647d9',
  '#5138b0',
  '#3e2c8a'
];

const aioCoral: MantineColorsTuple = [
  '#fff0ec',
  '#ffe0d8',
  '#ffc0b0',
  '#ff9e85',
  '#fc8261',
  '#f9704f',
  '#f76b4b', // 6 - accent brand coral
  '#e0553a',
  '#bd4530',
  '#9a3826'
];

// Neutral near-black surfaces for dark mode (Mantine's default dark is bluish;
// the AIO look is a neutral charcoal/near-black).
const aioDark: MantineColorsTuple = [
  '#e7e7ea',
  '#c3c3ca',
  '#9a9aa4',
  '#71717c',
  '#3f3f47',
  '#2a2a31', // 5 - borders
  '#17171b', // 6 - cards / elevated surfaces
  '#101014', // 7 - body background
  '#0b0b0e', // 8
  '#070709' // 9
];

export const theme = createTheme({
  primaryColor: 'aio-violet',
  primaryShade: { light: 6, dark: 5 },
  autoContrast: true,
  defaultRadius: 'md',
  colors: {
    'aio-violet': aioViolet,
    'aio-coral': aioCoral,
    dark: aioDark
  },
  components: {
    Paper: { defaultProps: { radius: 'md' } },
    Card: { defaultProps: { radius: 'md' } },
    Button: { defaultProps: { radius: 'md' } }
  }
});

export const vars = themeToVars(theme);
