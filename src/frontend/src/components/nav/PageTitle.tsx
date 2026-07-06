import { useEffect, useMemo } from 'react';
import { useGlobalSettingsState } from '../../states/SettingsStates';

/**
 * Component to set the page title
 */
export default function PageTitle({
  title,
  subtitle
}: Readonly<{
  title?: string;
  subtitle?: string;
}>) {
  const globalSettings = useGlobalSettingsState();

  const pageTitle = useMemo(() => {
    const instanceName = globalSettings.getSetting(
      'INVENTREE_INSTANCE',
      'AIO Inventory'
    );

    // Use the AIO brand name unless a custom instance name has been set
    const brand =
      !instanceName || instanceName === 'InvenTree'
        ? 'AIO Inventory'
        : instanceName;

    let data = '';

    if (title) {
      data += title;
    }

    if (subtitle) {
      data += ` - ${subtitle}`;
    }

    // Always show the brand name in the browser tab title
    data = data ? `${brand} | ${data}` : brand;

    return data;
  }, [title, subtitle, globalSettings]);

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  return <title>{pageTitle}</title>;
}
