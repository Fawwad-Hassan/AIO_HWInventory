import { t } from '@lingui/core/macro';
import { ActionIcon, useComputedColorScheme } from '@mantine/core';
import { type ReactNode, forwardRef } from 'react';
import { NavLink } from 'react-router-dom';

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
 * Render the AIO brand mark (white on dark, charcoal on light).
 *
 * Note: we intentionally always use the AIO mark and do NOT fall back to the
 * server's "customize.logo" (which defaults to the InvenTree logo).
 */
export function InvenTreeLogo({
  height = 28
}: {
  height?: number;
} = {}): ReactNode {
  const computedColorScheme = useComputedColorScheme('dark');

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
