import { t } from '@lingui/core/macro';
import { BarChart } from '@mantine/charts';
import {
  Button,
  Card,
  Center,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title
} from '@mantine/core';
import { IconReportMoney } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { ApiEndpoints } from '@lib/enums/ApiEndpoints';
import { apiUrl } from '@lib/functions/Api';
import { api } from '../../App';
import SummaryStrip, { type SummaryMetric } from './SummaryStrip';

function pkr(value: number): string {
  return `${Math.round(value).toLocaleString()} PKR`;
}

function ValueCard({
  label,
  value,
  color
}: {
  readonly label: string;
  readonly value: string;
  readonly color?: string;
}) {
  return (
    <Card withBorder padding='md' radius='md'>
      <Text size='xs' c='dimmed' tt='uppercase' fw={700}>
        {label}
      </Text>
      <Text size='xl' fw={700} c={color}>
        {value}
      </Text>
    </Card>
  );
}

/**
 * Analytics home page: an at-a-glance overview of the inventory and spending,
 * replacing the default widget dashboard.
 */
export default function AnalyticsHome() {
  const navigate = useNavigate();

  const inventoryMetrics: SummaryMetric[] = [
    {
      title: t`Total Parts`,
      endpoint: ApiEndpoints.part_list,
      params: { active: true }
    },
    {
      title: t`In Stock`,
      endpoint: ApiEndpoints.part_list,
      params: { active: true, has_stock: true },
      color: 'teal'
    },
    {
      title: t`Low Stock`,
      endpoint: ApiEndpoints.part_list,
      params: { active: true, low_stock: true },
      color: 'orange',
      link: '/low-stock'
    },
    {
      title: t`Out of Stock`,
      endpoint: ApiEndpoints.part_list,
      params: { active: true, has_stock: false },
      color: 'red'
    },
    {
      title: t`Stock Items`,
      endpoint: ApiEndpoints.stock_item_list,
      params: { in_stock: true }
    },
    { title: t`Locations`, endpoint: ApiEndpoints.stock_location_list }
  ];

  const query = useQuery({
    queryKey: ['budget-records-home'],
    queryFn: () =>
      api
        .get(apiUrl(ApiEndpoints.purchase_record_list), {
          params: { limit: 5000 }
        })
        .then((r: any) => r.data?.results ?? r.data ?? [])
        .catch(() => [])
  });

  const spending = useMemo(() => {
    const records: any[] = query.data ?? [];
    let totalRecurring = 0;
    let totalCapital = 0;
    const byMonth: Record<string, { Recurring: number; Capital: number }> = {};

    for (const r of records) {
      const amt = Number(r.total_cost_base) || 0;
      const month = String(r.date).slice(0, 7);
      byMonth[month] = byMonth[month] || { Recurring: 0, Capital: 0 };
      if (r.budget_type === 'capital') {
        totalCapital += amt;
        byMonth[month].Capital += amt;
      } else {
        totalRecurring += amt;
        byMonth[month].Recurring += amt;
      }
    }

    const months = Object.keys(byMonth).sort();
    const monthlyData = months
      .slice(-6)
      .map((m) => ({ month: m, ...byMonth[m] }));
    const recent = [...records]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 5);

    return {
      total: totalRecurring + totalCapital,
      totalRecurring,
      totalCapital,
      monthlyData,
      recent
    };
  }, [query.data]);

  return (
    <Stack gap='lg'>
      <div>
        <Title order={3}>{t`Welcome to AIO Inventory`}</Title>
        <Text c='dimmed'>{t`A snapshot of your inventory and spending.`}</Text>
      </div>

      <div>
        <Title order={4} mb='xs'>
          {t`Inventory overview`}
        </Title>
        <SummaryStrip metrics={inventoryMetrics} />
      </div>

      <div>
        <Group justify='space-between' mb='xs'>
          <Title order={4}>{t`Spending & budget`}</Title>
          <Button
            variant='light'
            leftSection={<IconReportMoney size={16} />}
            onClick={() => navigate('/purchasing/index/budget')}
          >
            {t`Open budget`}
          </Button>
        </Group>

        {query.isLoading ? (
          <Center h={120}>
            <Loader />
          </Center>
        ) : (
          <Stack gap='sm'>
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <ValueCard label={t`Total Spend`} value={pkr(spending.total)} />
              <ValueCard
                label={t`Recurring`}
                value={pkr(spending.totalRecurring)}
                color='blue'
              />
              <ValueCard
                label={t`Capital`}
                value={pkr(spending.totalCapital)}
                color='orange'
              />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, lg: 2 }}>
              <Paper withBorder p='md' radius='md'>
                <Title order={5} mb='sm'>
                  {t`Monthly spend`}
                </Title>
                <BarChart
                  h={220}
                  data={spending.monthlyData}
                  dataKey='month'
                  type='stacked'
                  series={[
                    { name: 'Recurring', label: t`Recurring`, color: 'blue.6' },
                    { name: 'Capital', label: t`Capital`, color: 'orange.6' }
                  ]}
                  valueFormatter={(v) => pkr(v)}
                  withLegend
                  legendProps={{ verticalAlign: 'top', height: 30 }}
                />
              </Paper>
              <Paper withBorder p='md' radius='md'>
                <Title order={5} mb='sm'>
                  {t`Recent purchases`}
                </Title>
                <Table>
                  <Table.Tbody>
                    {spending.recent.map((r: any) => (
                      <Table.Tr key={r.pk}>
                        <Table.Td>{r.date}</Table.Td>
                        <Table.Td>{r.item}</Table.Td>
                        <Table.Td ta='right' fw={600}>
                          {pkr(Number(r.total_cost_base))}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                    {spending.recent.length === 0 && (
                      <Table.Tr>
                        <Table.Td colSpan={3}>
                          <Text c='dimmed' size='sm'>
                            {t`No purchases logged yet.`}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Paper>
            </SimpleGrid>
          </Stack>
        )}
      </div>
    </Stack>
  );
}
