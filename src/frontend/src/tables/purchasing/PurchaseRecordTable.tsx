import { t } from '@lingui/core/macro';
import { ActionIcon, Badge, Box, Group, Table, Text } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from 'mantine-datatable';
import { useMemo, useState } from 'react';

import { AddItemButton } from '@lib/components/AddItemButton';
import { ApiEndpoints } from '@lib/enums/ApiEndpoints';
import { apiUrl } from '@lib/functions/Api';
import { api } from '../../App';
import {
  useDeleteApiFormModal,
  useEditApiFormModal
} from '../../hooks/UseForm';
import AddPurchaseModal from './AddPurchaseModal';

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

/** Small coloured badge for the budget type (or "Mixed"). */
function TypeBadge({ type }: { readonly type: string }) {
  if (type === 'mixed') {
    return (
      <Badge color='gray' variant='light'>
        {t`Mixed`}
      </Badge>
    );
  }
  return (
    <Badge color={type === 'capital' ? 'orange' : 'blue'} variant='light'>
      {type === 'capital' ? t`Capital` : t`Recurring`}
    </Badge>
  );
}

function money(value: any): string {
  return Math.round(Number(value) || 0).toLocaleString();
}

function qtyDisplay(value: any): string {
  return Number(value || 0).toLocaleString();
}

function unitDisplay(item: any): string {
  let unit = Number(item.unit_cost);
  if (!unit && item.quantity) {
    unit = Number(item.total_cost) / Number(item.quantity);
  }
  if (!unit) {
    return '—';
  }
  return `${Math.round(unit).toLocaleString()} ${item.currency || ''}`.trim();
}

/**
 * Purchase records, grouped into "purchases": each row is one purchase order
 * (or, for historical/manual entries, one supplier+date batch) and expands to
 * show the individual items bought.
 */
export default function PurchaseRecordTable() {
  const query = useQuery({
    queryKey: ['budget-records-grouped'],
    queryFn: () =>
      api
        .get(apiUrl(ApiEndpoints.purchase_record_list), {
          params: { limit: 5000 }
        })
        .then((r: any) => r.data?.results ?? r.data ?? [])
        .catch(() => [])
  });

  const [selected, setSelected] = useState<number>(-1);

  const [addOpen, setAddOpen] = useState<boolean>(false);

  const editRecord = useEditApiFormModal({
    url: ApiEndpoints.purchase_record_list,
    pk: selected,
    title: t`Edit Purchase Record`,
    fields: recordFields(),
    onFormSuccess: () => query.refetch()
  });

  const deleteRecord = useDeleteApiFormModal({
    url: ApiEndpoints.purchase_record_list,
    pk: selected,
    title: t`Delete Purchase Record`,
    onFormSuccess: () => query.refetch()
  });

  const groups = useMemo(() => {
    const records: any[] = query.data ?? [];
    const map = new Map<string, any>();

    for (const r of records) {
      const isPO = !!r.purchase_order;
      const key = isPO ? `po-${r.purchase_order}` : `h-${r.date}|${r.supplier}`;

      if (!map.has(key)) {
        map.set(key, {
          id: key,
          isPO,
          label: isPO
            ? r.purchase_order_reference || `PO #${r.purchase_order}`
            : r.supplier || t`Unknown supplier`,
          date: r.date,
          supplier: r.supplier,
          items: [],
          total: 0
        });
      }

      const g = map.get(key);
      g.items.push(r);
      g.total += Number(r.total_cost_base) || 0;
    }

    const arr = [...map.values()];
    for (const g of arr) {
      const types = new Set(g.items.map((i: any) => i.budget_type));
      g.type = types.size === 1 ? [...types][0] : 'mixed';
      g.count = g.items.length;
    }

    // Most recent first, then largest spend
    arr.sort((a, b) => {
      if (a.date !== b.date) {
        return a.date < b.date ? 1 : -1;
      }
      return b.total - a.total;
    });

    return arr;
  }, [query.data]);

  const columns = useMemo(
    () => [
      {
        accessor: 'label',
        title: t`Purchase`,
        render: (g: any) => (
          <Group gap='xs' wrap='nowrap'>
            {g.isPO && (
              <Badge color='green' variant='light' size='sm'>
                PO
              </Badge>
            )}
            <Text size='sm' fw={500}>
              {g.label}
            </Text>
          </Group>
        )
      },
      { accessor: 'date', title: t`Date` },
      {
        accessor: 'supplier',
        title: t`Supplier`,
        render: (g: any) => g.supplier || '—'
      },
      {
        accessor: 'count',
        title: t`Items`,
        textAlign: 'right' as const
      },
      {
        accessor: 'type',
        title: t`Type`,
        render: (g: any) => <TypeBadge type={g.type} />
      },
      {
        accessor: 'total',
        title: t`Total (PKR)`,
        textAlign: 'right' as const,
        render: (g: any) => (
          <Text size='sm' fw={600}>
            {money(g.total)}
          </Text>
        )
      }
    ],
    []
  );

  return (
    <>
      <AddPurchaseModal
        opened={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => query.refetch()}
      />
      {editRecord.modal}
      {deleteRecord.modal}
      <Group justify='flex-end' mb='xs'>
        <AddItemButton
          tooltip={t`Add Purchase`}
          onClick={() => setAddOpen(true)}
        />
      </Group>
      <DataTable
        idAccessor='id'
        withTableBorder
        withColumnBorders
        highlightOnHover
        minHeight={150}
        fetching={query.isLoading}
        noRecordsText={t`No purchase records`}
        records={groups}
        columns={columns}
        rowExpansion={{
          content: ({ record }: any) => (
            <Box p='sm'>
              <Table striped withTableBorder withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t`Item`}</Table.Th>
                    <Table.Th>{t`Type`}</Table.Th>
                    <Table.Th>{t`Department`}</Table.Th>
                    <Table.Th ta='right'>{t`Qty`}</Table.Th>
                    <Table.Th ta='right'>{t`Unit`}</Table.Th>
                    <Table.Th ta='right'>{t`Total (PKR)`}</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {record.items.map((it: any) => (
                    <Table.Tr key={it.pk}>
                      <Table.Td>{it.item}</Table.Td>
                      <Table.Td>
                        <TypeBadge type={it.budget_type} />
                      </Table.Td>
                      <Table.Td>{it.department || '—'}</Table.Td>
                      <Table.Td ta='right'>{qtyDisplay(it.quantity)}</Table.Td>
                      <Table.Td ta='right'>{unitDisplay(it)}</Table.Td>
                      <Table.Td ta='right'>
                        {money(it.total_cost_base)}
                      </Table.Td>
                      <Table.Td>
                        {!it.purchase_order && (
                          <Group gap={4} justify='flex-end' wrap='nowrap'>
                            <ActionIcon
                              variant='subtle'
                              color='blue'
                              onClick={() => {
                                setSelected(it.pk);
                                editRecord.open();
                              }}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon
                              variant='subtle'
                              color='red'
                              onClick={() => {
                                setSelected(it.pk);
                                deleteRecord.open();
                              }}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>
          )
        }}
      />
    </>
  );
}
