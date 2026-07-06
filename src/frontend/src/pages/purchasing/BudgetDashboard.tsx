import { t } from '@lingui/core/macro';
import { BarChart, DonutChart } from '@mantine/charts';
import {
  Card,
  Center,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { ApiEndpoints } from '@lib/enums/ApiEndpoints';
import { apiUrl } from '@lib/functions/Api';
import { api } from '../../App';
import PurchaseRecordTable from '../../tables/purchasing/PurchaseRecordTable';

const DEPT_COLORS = [
  'blue.6',
  'orange.6',
  'teal.6',
  'grape.6',
  'red.6',
  'yellow.6',
  'cyan.6',
  'pink.6'
];

function fmt(v: number): string {
  return `${Math.round(v).toLocaleString()} PKR`;
}

function quarterOf(dateStr: string): string {
  const d = new Date(dateStr);
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${d.getFullYear()}-Q${q}`;
}

function StatCard({
  label,
  value,
  color,
  hint
}: {
  readonly label: string;
  readonly value: string;
  readonly color?: string;
  readonly hint?: string;
}) {
  return (
    <Card withBorder padding='md' radius='md'>
      <Text size='xs' c='dimmed' tt='uppercase' fw={700}>
        {label}
      </Text>
      <Text size='xl' fw={700} c={color}>
        {value}
      </Text>
      {hint && (
        <Text size='xs' c='dimmed'>
          {hint}
        </Text>
      )}
    </Card>
  );
}

/**
 * Budget dashboard: spend insights and recommended budgets derived from the
 * logged purchase records (recurring vs capital).
 */
export default function BudgetDashboard() {
  const query = useQuery({
    queryKey: ['budget-records'],
    queryFn: () =>
      api
        .get(apiUrl(ApiEndpoints.purchase_record_list), {
          params: { limit: 5000 }
        })
        .then((r: any) => r.data?.results ?? r.data ?? [])
        .catch(() => [])
  });

  const analysis = useMemo(() => {
    const records: any[] = query.data ?? [];
    const byMonth: Record<string, { Recurring: number; Capital: number }> = {};
    const byQuarterCapital: Record<string, number> = {};
    const byDept: Record<string, number> = {};
    const byItemRecurring: Record<string, number> = {};
    let totalRecurring = 0;
    let totalCapital = 0;

    for (const r of records) {
      const amt = Number(r.total_cost_base) || 0;
      const month = String(r.date).slice(0, 7);
      byMonth[month] = byMonth[month] || { Recurring: 0, Capital: 0 };

      if (r.budget_type === 'capital') {
        byMonth[month].Capital += amt;
        totalCapital += amt;
        const q = quarterOf(r.date);
        byQuarterCapital[q] = (byQuarterCapital[q] || 0) + amt;
      } else {
        byMonth[month].Recurring += amt;
        totalRecurring += amt;
        byItemRecurring[r.item] = (byItemRecurring[r.item] || 0) + amt;
      }

      const dept = r.department || t`Unspecified`;
      byDept[dept] = (byDept[dept] || 0) + amt;
    }

    const months = Object.keys(byMonth).sort();
    const monthlyData = months.map((m) => ({ month: m, ...byMonth[m] }));

    // Recommended monthly recurring budget: average recurring/month + 10% buffer
    const recurringPerMonth = months.map((m) => byMonth[m].Recurring);
    const avgRecurring = recurringPerMonth.length
      ? recurringPerMonth.reduce((a, b) => a + b, 0) / recurringPerMonth.length
      : 0;
    const recMonthlyRecurring = Math.round((avgRecurring * 1.1) / 500) * 500;

    // Recommended quarterly capital budget: average capital/quarter
    const capQuarters = Object.values(byQuarterCapital);
    const avgCapitalQ = capQuarters.length
      ? capQuarters.reduce((a, b) => a + b, 0) / capQuarters.length
      : 0;
    const recQuarterlyCapital = Math.round(avgCapitalQ / 1000) * 1000;

    const deptData = Object.entries(byDept)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({
        name,
        value,
        color: DEPT_COLORS[i % DEPT_COLORS.length]
      }));

    const topItems = Object.entries(byItemRecurring)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));

    return {
      total: totalRecurring + totalCapital,
      totalRecurring,
      totalCapital,
      monthlyData,
      deptData,
      topItems,
      recMonthlyRecurring,
      recQuarterlyCapital
    };
  }, [query.data]);

  if (query.isLoading) {
    return (
      <Center h={200}>
        <Loader />
      </Center>
    );
  }

  return (
    <Stack gap='md'>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }}>
        <StatCard label={t`Total Spend`} value={fmt(analysis.total)} />
        <StatCard
          label={t`Recurring`}
          value={fmt(analysis.totalRecurring)}
          color='blue'
        />
        <StatCard
          label={t`Capital`}
          value={fmt(analysis.totalCapital)}
          color='orange'
        />
        <StatCard
          label={t`Recommended Monthly Recurring`}
          value={fmt(analysis.recMonthlyRecurring)}
          color='blue.7'
          hint={t`avg recurring/month + 10%`}
        />
        <StatCard
          label={t`Recommended Quarterly Capital`}
          value={fmt(analysis.recQuarterlyCapital)}
          color='orange.7'
          hint={t`avg capital/quarter`}
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <Paper withBorder p='md' radius='md'>
          <Title order={5} mb='sm'>
            {t`Monthly spend (recurring vs capital)`}
          </Title>
          <BarChart
            h={280}
            data={analysis.monthlyData}
            dataKey='month'
            type='stacked'
            series={[
              { name: 'Recurring', label: t`Recurring`, color: 'blue.6' },
              { name: 'Capital', label: t`Capital`, color: 'orange.6' }
            ]}
            valueFormatter={(v) => fmt(v)}
          />
        </Paper>
        <Paper withBorder p='md' radius='md'>
          <Title order={5} mb='sm'>
            {t`Spend by department`}
          </Title>
          <Center>
            <DonutChart
              data={analysis.deptData}
              size={240}
              thickness={40}
              withLabelsLine={false}
              valueFormatter={(v) => fmt(v)}
            />
          </Center>
        </Paper>
      </SimpleGrid>

      <Paper withBorder p='md' radius='md'>
        <Title order={5} mb='sm'>
          {t`Top recurring items`}
        </Title>
        <Stack gap={4}>
          {analysis.topItems.map((it) => (
            <Group key={it.name} justify='space-between'>
              <Text size='sm'>{it.name}</Text>
              <Text size='sm' fw={600}>
                {fmt(it.value)}
              </Text>
            </Group>
          ))}
        </Stack>
      </Paper>

      <Paper withBorder p='md' radius='md'>
        <Title order={5} mb='sm'>
          {t`Purchase records`}
        </Title>
        <PurchaseRecordTable />
      </Paper>
    </Stack>
  );
}
