import { t } from '@lingui/core/macro';
import { ActionIcon, useComputedColorScheme } from '@mantine/core';
import { type ReactNode, forwardRef } from 'react';
import { NavLink } from 'react-router-dom';

import { useShallow } from 'zustand/react/shallow';
import { useServerApiState } from '../../states/ServerApiState';
import aioLogoDark from './aio_logo_dark.png';
import aioLogoLight from './aio_logo_light.png';

export const InvenTreeLogoHomeButton = forwardRef<HTMLDivElement>(
  (props, ref) => {
    return (
      <div ref={ref} {...props}>
        <NavLink to={'/'}>
          <ActionIcon size={28} variant='transparent'>
            <InvenTreeLogo />
          </ActionIcon>
        </NavLink>
      </div>
    );
  }
);

/*
 * Render the AIO logo
 * - Uses the custom logo if one is defined on the server
 * - Otherwise, uses the AIO brand mark (white on dark, dark on light)
 */
export function InvenTreeLogo({
  height = 28
}: {
  height?: number;
} = {}): ReactNode {
  const computedColorScheme = useComputedColorScheme('dark');

  const [server] = useServerApiState(
    useShallow((state) => [state.server, state.fetchServerApiState])
  );

  if (server.server && server.customize?.logo) {
    return (
      <img src={server.customize.logo} alt={t`AIO Logo`} height={height} />
    );
  }

  const logo = computedColorScheme === 'dark' ? aioLogoDark : aioLogoLight;

  return (
    <img
      src={logo}
      alt={t`AIO Logo`}
      height={height}
      style={{ width: 'auto', display: 'block' }}
    />
  );
}
