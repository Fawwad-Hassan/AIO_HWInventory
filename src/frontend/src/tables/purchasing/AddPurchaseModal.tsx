import { t } from '@lingui/core/macro';
import {
  ActionIcon,
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Table,
  TextInput
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { ApiEndpoints } from '@lib/enums/ApiEndpoints';
import { apiUrl } from '@lib/functions/Api';
import { api } from '../../App';

type ItemRow = {
  item: string;
  budget_type: string;
  department: string;
  quantity: number | string;
  unit_cost: number | string;
};

function emptyRow(): ItemRow {
  return {
    item: '',
    budget_type: 'recurring',
    department: '',
    quantity: 1,
    unit_cost: ''
  };
}

function todayStr(): string {
  const d = new Date();
  const mm = `${d.getMonth() + 1}`.padStart(2, '0');
  const dd = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * Modal for logging a purchase with one or more items in a single entry.
 * Shared info (date, supplier, currency) is entered once; each item row becomes
 * its own budget record, so they group together as one purchase.
 */
export default function AddPurchaseModal({
  opened,
  onClose,
  onSuccess
}: {
  readonly opened: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}) {
  const [date, setDate] = useState<string>(todayStr());
  const [supplier, setSupplier] = useState<string>('');
  const [currency, setCurrency] = useState<string>('PKR');
  const [rows, setRows] = useState<ItemRow[]>([emptyRow()]);
  const [saving, setSaving] = useState<boolean>(false);

  const departments = useQuery({
    queryKey: ['departments-active'],
    queryFn: () =>
      api
        .get(apiUrl(ApiEndpoints.department_list), {
          params: { active: true }
        })
        .then((r: any) => r.data?.results ?? r.data ?? [])
        .catch(() => [])
  });

  const deptOptions = (departments.data ?? []).map((d: any) => ({
    value: d.name,
    label: d.name
  }));

  const updateRow = (index: number, key: keyof ItemRow, value: any) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [key]: value } : r))
    );
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (index: number) =>
    setRows((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev
    );

  const reset = () => {
    setDate(todayStr());
    setSupplier('');
    setCurrency('PKR');
    setRows([emptyRow()]);
  };

  const save = async () => {
    const valid = rows.filter((r) => r.item.trim() !== '');
    if (valid.length === 0) {
      return;
    }

    setSaving(true);
    try {
      for (const r of valid) {
        const qty = Number(r.quantity) || 0;
        const unit = Number(r.unit_cost) || 0;
        await api.post(apiUrl(ApiEndpoints.purchase_record_list), {
          date: date,
          item: r.item,
          department: r.department || '',
          budget_type: r.budget_type,
          supplier: supplier,
          quantity: qty,
          unit_cost: unit,
          total_cost: qty * unit,
          currency: currency,
          source: 'manual'
        });
      }
      reset();
      onSuccess();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t`Add Purchase`} size='xl'>
      <Stack gap='sm'>
        <Group grow>
          <TextInput
            label={t`Date`}
            type='date'
            value={date}
            onChange={(e) => setDate(e.currentTarget.value)}
          />
          <TextInput
            label={t`Supplier`}
            value={supplier}
            onChange={(e) => setSupplier(e.currentTarget.value)}
            placeholder={t`e.g. Digi Log`}
          />
          <Select
            label={t`Currency`}
            data={['PKR', 'USD', 'CNY']}
            value={currency}
            onChange={(v) => setCurrency(v ?? 'PKR')}
            allowDeselect={false}
          />
        </Group>

        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t`Item`}</Table.Th>
              <Table.Th>{t`Type`}</Table.Th>
              <Table.Th>{t`Department`}</Table.Th>
              <Table.Th>{t`Qty`}</Table.Th>
              <Table.Th>{t`Unit Cost`}</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((r, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional
              <Table.Tr key={i}>
                <Table.Td>
                  <TextInput
                    value={r.item}
                    onChange={(e) =>
                      updateRow(i, 'item', e.currentTarget.value)
                    }
                    placeholder={t`Item name`}
                  />
                </Table.Td>
                <Table.Td>
                  <Select
                    data={[
                      { value: 'recurring', label: t`Recurring` },
                      { value: 'capital', label: t`Capital` }
                    ]}
                    value={r.budget_type}
                    onChange={(v) =>
                      updateRow(i, 'budget_type', v ?? 'recurring')
                    }
                    allowDeselect={false}
                    w={130}
                  />
                </Table.Td>
                <Table.Td>
                  <Select
                    data={deptOptions}
                    value={r.department}
                    onChange={(v) => updateRow(i, 'department', v ?? '')}
                    placeholder={t`—`}
                    clearable
                    searchable
                    w={160}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    value={r.quantity}
                    onChange={(v) => updateRow(i, 'quantity', v)}
                    min={0}
                    w={80}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    value={r.unit_cost}
                    onChange={(v) => updateRow(i, 'unit_cost', v)}
                    min={0}
                    w={110}
                  />
                </Table.Td>
                <Table.Td>
                  <ActionIcon
                    variant='subtle'
                    color='red'
                    onClick={() => removeRow(i)}
                    disabled={rows.length <= 1}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <Group justify='space-between'>
          <Button
            variant='light'
            leftSection={<IconPlus size={16} />}
            onClick={addRow}
          >
            {t`Add item`}
          </Button>
          <Group>
            <Button variant='default' onClick={onClose}>
              {t`Cancel`}
            </Button>
            <Button onClick={save} loading={saving}>
              {t`Save purchase`}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
