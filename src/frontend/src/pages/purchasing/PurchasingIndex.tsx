import { t } from '@lingui/core/macro';
import { Accordion, Stack } from '@mantine/core';
import {
  IconBuildingFactory2,
  IconBuildingStore,
  IconBuildingWarehouse,
  IconCalendar,
  IconListDetails,
  IconPackageExport,
  IconReportMoney,
  IconShoppingCart,
  IconTable
} from '@tabler/icons-react';
import { useCallback, useMemo } from 'react';

import type { EventContentArg } from '@fullcalendar/core';
import { ApiEndpoints } from '@lib/enums/ApiEndpoints';
import { ModelType, PluginPanelKey } from '@lib/enums/ModelType';
import { UserRoles } from '@lib/enums/Roles';
import type { TableFilter } from '@lib/index';
import { useLocalStorage } from '@mantine/hooks';
import OrderCalendar from '../../components/calendar/OrderCalendar';
import OrderCalendarToolTip from '../../components/calendar/OrderCalendarToolTip';
import SummaryStrip, {
  type SummaryMetric
} from '../../components/dashboard/SummaryStrip';
import PermissionDenied from '../../components/errors/PermissionDenied';
import { PageDetail } from '../../components/nav/PageDetail';
import { PanelGroup } from '../../components/panels/PanelGroup';
import SegmentedControlPanel from '../../components/panels/SegmentedControlPanel';
import { useUserState } from '../../states/UserState';
import { CompanyTable } from '../../tables/company/CompanyTable';
import ParametricCompanyTable from '../../tables/company/ParametricCompanyTable';
import ManufacturerPartParametricTable from '../../tables/purchasing/ManufacturerPartParametricTable';
import { ManufacturerPartTable } from '../../tables/purchasing/ManufacturerPartTable';
import PurchaseOrderFilters from '../../tables/purchasing/PurchaseOrderFilters';
import PurchaseOrderParametricTable from '../../tables/purchasing/PurchaseOrderParametricTable';
import { PurchaseOrderTable } from '../../tables/purchasing/PurchaseOrderTable';
import { SupplierPartTable } from '../../tables/purchasing/SupplierPartTable';
import BudgetDashboard from './BudgetDashboard';

function PurchaseOrderCalendar() {
  const calendarFilters: TableFilter[] = useMemo(() => {
    return PurchaseOrderFilters({ includeDateFilters: false });
  }, []);

  const renderTooltip = useCallback((event: EventContentArg) => {
    return OrderCalendarToolTip({
      event: event,
      modelType: ModelType.company,
      instanceLookup: 'supplier_detail'
    });
  }, []);

  return (
    <OrderCalendar
      model={ModelType.purchaseorder}
      role={UserRoles.purchase_order}
      params={{ supplier_detail: true }}
      filters={calendarFilters}
      initialFilters={[{ name: 'outstanding', value: 'true' }]}
      tooltip={renderTooltip}
    />
  );
}

export default function PurchasingIndex() {
  const user = useUserState();

  const [purchaseOrderView, setPurchaseOrderView] = useLocalStorage<string>({
    key: 'purchase-order-view',
    defaultValue: 'table'
  });

  const [manufacturerView, setManufacturerView] = useLocalStorage<string>({
    key: 'manufacturer-view',
    defaultValue: 'table'
  });

  const [manufacturerPartsView, setManufacturerPartsView] =
    useLocalStorage<string>({
      key: 'manufacturer-parts-view',
      defaultValue: 'table'
    });

  const panels = useMemo(() => {
    // Prepend an at-a-glance summary strip to a panel's content
    const wrapWithSummary = (panel: any, metrics: SummaryMetric[]): any => ({
      ...panel,
      content: (
        <Stack gap='sm'>
          <SummaryStrip metrics={metrics} />
          {panel.content}
        </Stack>
      )
    });

    const poMetrics: SummaryMetric[] = [
      { title: t`Total Orders`, endpoint: ApiEndpoints.purchase_order_list },
      {
        title: t`Outstanding`,
        endpoint: ApiEndpoints.purchase_order_list,
        params: { outstanding: true },
        color: 'teal'
      },
      {
        title: t`Overdue`,
        endpoint: ApiEndpoints.purchase_order_list,
        params: { overdue: true },
        color: 'red'
      },
      {
        title: t`Completed`,
        endpoint: ApiEndpoints.purchase_order_list,
        params: { status: 30 },
        color: 'teal'
      }
    ];

    const supplierMetrics: SummaryMetric[] = [
      {
        title: t`Suppliers`,
        endpoint: ApiEndpoints.company_list,
        params: { is_supplier: true }
      },
      { title: t`Supplier Parts`, endpoint: ApiEndpoints.supplier_part_list },
      {
        title: t`Purchaseable Parts`,
        endpoint: ApiEndpoints.part_list,
        params: { active: true, purchaseable: true }
      }
    ];

    return [
      {
        name: 'budget',
        label: t`Budget`,
        icon: <IconReportMoney />,
        content: <BudgetDashboard />
      },
      wrapWithSummary(
        SegmentedControlPanel({
          name: 'purchaseorders',
          label: t`Purchase Orders`,
          icon: <IconShoppingCart />,
          hidden: !user.hasViewRole(UserRoles.purchase_order),
          selection: purchaseOrderView,
          onChange: setPurchaseOrderView,
          options: [
            {
              value: 'table',
              label: t`Table View`,
              icon: <IconTable />,
              content: <PurchaseOrderTable />
            },
            {
              value: 'calendar',
              label: t`Calendar View`,
              icon: <IconCalendar />,
              content: <PurchaseOrderCalendar />
            },
            {
              value: 'parametric',
              label: t`Parametric View`,
              icon: <IconListDetails />,
              content: <PurchaseOrderParametricTable />
            }
          ]
        }),
        poMetrics
      ),
      {
        name: 'suppliers',
        label: t`Suppliers & Parts`,
        icon: <IconBuildingStore />,
        content: (
          <Stack gap='sm'>
            <SummaryStrip metrics={supplierMetrics} />
            <Accordion
              multiple
              defaultValue={['suppliers', 'supplier-parts']}
              variant='separated'
            >
              <Accordion.Item value='suppliers'>
                <Accordion.Control icon={<IconBuildingStore />}>
                  {t`Suppliers`}
                </Accordion.Control>
                <Accordion.Panel>
                  <CompanyTable
                    companyType='supplier'
                    path='purchasing/supplier'
                    params={{ is_supplier: true }}
                  />
                </Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value='supplier-parts'>
                <Accordion.Control icon={<IconPackageExport />}>
                  {t`Supplier Parts`}
                </Accordion.Control>
                <Accordion.Panel>
                  <SupplierPartTable />
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </Stack>
        )
      },
      SegmentedControlPanel({
        name: 'manufacturer',
        label: t`Manufacturers`,
        icon: <IconBuildingFactory2 />,
        hidden: true,
        selection: manufacturerView,
        onChange: setManufacturerView,
        options: [
          {
            value: 'table',
            label: t`Table View`,
            icon: <IconTable />,
            content: (
              <CompanyTable
                companyType='manufacturer'
                path='purchasing/manufacturer'
                params={{ is_manufacturer: true }}
              />
            )
          },
          {
            value: 'parametric',
            label: t`Parametric View`,
            icon: <IconListDetails />,
            content: (
              <ParametricCompanyTable queryParams={{ is_manufacturer: true }} />
            )
          }
        ]
      }),
      SegmentedControlPanel({
        name: 'manufacturer-parts',
        label: t`Manufacturer Parts`,
        icon: <IconBuildingWarehouse />,
        hidden: true,
        selection: manufacturerPartsView,
        onChange: setManufacturerPartsView,
        options: [
          {
            value: 'table',
            label: t`Table View`,
            icon: <IconTable />,
            content: <ManufacturerPartTable />
          },
          {
            value: 'parametric',
            label: t`Parametric View`,
            icon: <IconListDetails />,
            content: <ManufacturerPartParametricTable />
          }
        ]
      })
    ];
  }, [user, manufacturerPartsView, manufacturerView, purchaseOrderView]);

  if (!user.isLoggedIn() || !user.hasViewRole(UserRoles.purchase_order)) {
    return <PermissionDenied />;
  }

  return (
    <Stack>
      <PageDetail title={t`Purchasing`} />
      <PanelGroup
        pageKey='purchasing-index'
        panels={panels}
        pluginPanelWithoutId
        pluginPanelKey={PluginPanelKey.purchasing}
      />
    </Stack>
  );
}
