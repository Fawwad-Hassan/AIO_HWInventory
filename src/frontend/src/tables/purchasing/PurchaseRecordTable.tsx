import { t } from '@lingui/core/macro';
import { Badge } from '@mantine/core';
import { useCallback, useMemo, useState } from 'react';

import { AddItemButton } from '@lib/components/AddItemButton';
import {
  type RowAction,
  RowDeleteAction,
  RowEditAction
} from '@lib/components/RowActions';
import { ApiEndpoints } from '@lib/enums/ApiEndpoints';
import { apiUrl } from '@lib/functions/Api';
import useTable from '@lib/hooks/UseTable';
import type { TableColumn } from '@lib/types/Tables';
import {
  useCreateApiFormModal,
  useDeleteApiFormModal,
  useEditApiFormModal
} from '../../hooks/UseForm';
import { DateColumn } from '../ColumnRenderers';
import { InvenTreeTable } from '../InvenTreeTable';

const recordFields = () => ({
  date: {},
  item: {},
  department: {},
  budget_type: {},
  supplier: {},
  quantity: {},
  unit_cost: {},
  total_cost: {},
  currency: {},
  notes: {}
});

/**
 * Table of budget purchase records (create / edit / delete).
 */
export default function PurchaseRecordTable() {
  const table = useTable('purchaserecord');

  const [selected, setSelected] = useState<number>(-1);

  const newRecord = useCreateApiFormModal({
    url: ApiEndpoints.purchase_record_list,
    title: t`Add Purchase Record`,
    fields: recordFields(),
    focus: 'item',
    table: table
  });

  const editRecord = useEditApiFormModal({
    url: ApiEndpoints.purchase_record_list,
    pk: selected,
    title: t`Edit Purchase Record`,
    fields: recordFields(),
    onFormSuccess: (record: any) => table.updateRecord(record)
  });

  const deleteRecord = useDeleteApiFormModal({
    url: ApiEndpoints.purchase_record_list,
    pk: selected,
    title: t`Delete Purchase Record`,
    table: table
  });

  const columns: TableColumn[] = useMemo(
    () => [
      DateColumn({ accessor: 'date', title: t`Date` }),
      { accessor: 'item', title: t`Item`, sortable: true, switchable: false },
      {
        accessor: 'budget_type',
        title: t`Type`,
        sortable: true,
        render: (record: any) => (
          <Badge
            color={record.budget_type === 'capital' ? 'orange' : 'blue'}
            variant='light'
          >
            {record.budget_type === 'capital' ? t`Capital` : t`Recurring`}
          </Badge>
        )
      },
      { accessor: 'department', title: t`Department`, sortable: true },
      { accessor: 'supplier', title: t`Supplier`, sortable: true },
      {
        accessor: 'total_cost_base',
        title: t`Total (PKR)`,
        sortable: true,
        render: (record: any) => Number(record.total_cost_base).toLocaleString()
      }
    ],
    []
  );

  const tableActions = useMemo(
    () => [
      <AddItemButton
        key='add-record'
        tooltip={t`Add Purchase Record`}
        onClick={() => newRecord.open()}
      />
    ],
    []
  );

  const rowActions = useCallback(
    (record: any): RowAction[] => [
      RowEditAction({
        onClick: () => {
          setSelected(record.pk);
          editRecord.open();
        }
      }),
      RowDeleteAction({
        onClick: () => {
          setSelected(record.pk);
          deleteRecord.open();
        }
      })
    ],
    []
  );

  return (
    <>
      {newRecord.modal}
      {editRecord.modal}
      {deleteRecord.modal}
      <InvenTreeTable
        url={apiUrl(ApiEndpoints.purchase_record_list)}
        tableState={table}
        columns={columns}
        props={{
          enableDownload: true,
          tableActions: tableActions,
          rowActions: rowActions,
          tableFilters: [
            {
              name: 'budget_type',
              label: t`Budget Type`,
              description: t`Filter by recurring or capital`
            }
          ]
        }}
      />
    </>
  );
}
