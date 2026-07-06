import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react';
import {
  MantineProvider,
  type MantineThemeOverride,
  createTheme,
  mergeThemeOverrides
} from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { ContextMenuProvider } from 'mantine-contextmenu';
import type { JSX } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { AboutInvenTreeModal } from '../components/modals/AboutInvenTreeModal';
import { HotkeyModal } from '../components/modals/HotkeyModal';
import { LicenseModal } from '../components/modals/LicenseModal';
import { QrModal } from '../components/modals/QrModal';
import { ServerInfoModal } from '../components/modals/ServerInfoModal';
import { useLocalState } from '../states/LocalState';
import { theme as brandTheme } from '../theme';
import { LanguageContext } from './LanguageContext';
import { colorSchema } from './colorSchema';

export function ThemeContext({
  children
}: Readonly<{ children: JSX.Element }>) {
  const [userTheme] = useLocalState(useShallow((state) => [state.userTheme]));

  let customUserTheme: MantineThemeOverride | undefined = undefined;

  // Theme
  try {
    // Per-user tweaks that are safe to keep alongside the brand theme.
    // The AIO brand theme (colors, primary colour, radius) is applied on top
    // so the branded look is consistent regardless of stored user settings.
    const userOverride = createTheme({
      white: userTheme.whiteColor,
      black: userTheme.blackColor,
      breakpoints: {
        xs: '30em',
        sm: '48em',
        md: '64em',
        lg: '74em',
        xl: '90em'
      }
    });

    customUserTheme = mergeThemeOverrides(userOverride, brandTheme);
  } catch (error) {
    console.error('Error creating theme with user settings:', error);
    // Fallback to default theme if there's an error
    customUserTheme = undefined;
  }

  return (
    <MantineProvider
      theme={customUserTheme}
      colorSchemeManager={colorSchema}
      defaultColorScheme='dark'
    >
      <ContextMenuProvider>
        <LanguageContext>
          <ModalsProvider
            labels={{
              confirm: <Trans id={msg`Submit`.id} />,
              cancel: <Trans id={msg`Cancel`.id} />
            }}
            modals={{
              info: ServerInfoModal,
              about: AboutInvenTreeModal,
              license: LicenseModal,
              qr: QrModal,
              hotkey: HotkeyModal
            }}
          >
            <Notifications />
            {children}
          </ModalsProvider>
        </LanguageContext>
      </ContextMenuProvider>
    </MantineProvider>
  );
}
