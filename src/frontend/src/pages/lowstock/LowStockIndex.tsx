import { t } from '@lingui/core/macro';
import { Stack } from '@mantine/core';

import { PageDetail } from '../../components/nav/PageDetail';
import { PartListTable } from '../../tables/part/PartTable';

/**
 * Top-level "Low Stock" page.
 *
 * Lists only the parts whose current stock is below their configured minimum
 * stock level (the backend `low_stock` filter). Because the filter is applied
 * server-side, parts automatically drop off this list once their stock rises
 * back above the minimum.
 */
export default function LowStockIndex() {
  return (
    <Stack>
      <PageDetail title={t`Low Stock`} />
      <PartListTable
        tableName='low-stock'
        enableImport={false}
        props={{
          params: {
            low_stock: true
          }
        }}
      />
    </Stack>
  );
}
