import { t } from '@lingui/core/macro';
import { Anchor, Group, HoverCard, Image } from '@mantine/core';
import { useMemo } from 'react';

import type { ThumbnailProps } from '@lib/types/Rendering';
import { ApiImage } from './ApiImage';

/*
 * Render an image, loaded via the API
 */
export function Thumbnail({
  src,
  alt = t`Thumbnail`,
  size = 20,
  link,
  text,
  align,
  hover,
  hoverSize = 128
}: Readonly<ThumbnailProps>) {
  // Treat the blank/placeholder image as "no image", so empty placeholders are
  // never shown (in tables, dropdowns or inline renders).
  const imageSrc = useMemo(() => {
    if (!src || src.includes('blank_image')) {
      return undefined;
    }
    return src;
  }, [src]);

  const inner = useMemo(() => {
    if (link) {
      return (
        <Anchor href={link} target='_blank'>
          {text}
        </Anchor>
      );
    } else {
      return text;
    }
  }, [link, text]);

  return (
    <HoverCard
      disabled={!hover || !imageSrc}
      withinPortal
      shadow='xs'
      openDelay={300}
      closeDelay={50}
    >
      <HoverCard.Target>
        <Group align={align ?? 'left'} gap='xs' wrap='nowrap'>
          {/* Only render an image when one has actually been uploaded -
              empty placeholder images are intentionally not shown. */}
          {imageSrc && (
            <ApiImage
              src={imageSrc}
              aria-label={alt}
              w={size}
              fit='contain'
              radius='xs'
              style={{ maxHeight: size, height: size }}
            />
          )}
          {inner}
        </Group>
      </HoverCard.Target>
      <HoverCard.Dropdown>
        <Image
          src={imageSrc ?? ''}
          alt={alt}
          w={hoverSize}
          fit='contain'
          style={{ maxHeight: hoverSize }}
        />
      </HoverCard.Dropdown>
    </HoverCard>
  );
}
