import { t } from '@lingui/core/macro';
import AnalyticsHome from '../../components/dashboard/AnalyticsHome';
import PageTitle from '../../components/nav/PageTitle';

export default function Home() {
  return (
    <>
      <PageTitle title={t`Home`} />
      <AnalyticsHome />
    </>
  );
}
