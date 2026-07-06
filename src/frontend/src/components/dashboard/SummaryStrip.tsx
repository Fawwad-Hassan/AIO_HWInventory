import { Card, SimpleGrid, Skeleton, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import type { ApiEndpoints } from '@lib/enums/ApiEndpoints';
import { apiUrl } from '@lib/functions/Api';
import { api } from '../../App';

/**
 * A single metric shown in a summary strip. The value is the total number of
 * results returned by the given API endpoint + params (fetched cheaply with
 * limit=1, reading the paginated "count").
 */
export type SummaryMetric = {
  title: string;
  endpoint: ApiEndpoints;
  params?: Record<string, any>;
  color?: string;
  /** Optional link to navigate to when the card is clicked. */
  link?: string;
};

function MetricCard({ metric }: { readonly metric: SummaryMetric }) {
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ['summary-metric', metric.endpoint, metric.params],
    queryFn: () =>
      api
        .get(apiUrl(metric.endpoint), {
          params: { ...metric.params, limit: 1 }
        })
        .then((r: any) => r.data?.count ?? 0)
        .catch(() => 0)
  });

  const clickable = !!metric.link;

  return (
    <Card
      withBorder
      padding='md'
      radius='md'
      onClick={clickable ? () => navigate(metric.link as string) : undefined}
      style={{ cursor: clickable ? 'pointer' : undefined }}
    >
      <Text size='xs' c='dimmed' tt='uppercase' fw={700}>
        {metric.title}
      </Text>
      {query.isLoading ? (
        <Skeleton height={28} width={60} mt={6} />
      ) : (
        <Text size='xl' fw={700} c={metric.color}>
          {Number(query.data).toLocaleString()}
        </Text>
      )}
    </Card>
  );
}

/**
 * A responsive row of at-a-glance count cards, used to summarise a list page.
 */
export default function SummaryStrip({
  metrics
}: {
  readonly metrics: SummaryMetric[];
}) {
  return (
    <SimpleGrid cols={{ base: 2, sm: metrics.length }} spacing='sm'>
      {metrics.map((metric) => (
        <MetricCard key={metric.title} metric={metric} />
      ))}
    </SimpleGrid>
  );
}
