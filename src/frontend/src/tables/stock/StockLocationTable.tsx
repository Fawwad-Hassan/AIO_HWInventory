import { t } from '@lingui/core/macro';
import { Anchor, Breadcrumbs, Group, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useCallback, useMemo, useState } from 'react';

import { AddItemButton } from '@lib/components/AddItemButton';
import {
  type RowAction,
  RowDeleteAction,
  RowEditAction
} from '@lib/components/RowActions';
import { ApiEndpoints } from '@lib/enums/ApiEndpoints';
import { ModelType } from '@lib/enums/ModelType';
import { UserRoles } from '@lib/enums/Roles';
import { apiUrl } from '@lib/functions/Api';
import useTable from '@lib/hooks/UseTable';
import type { TableFilter } from '@lib/types/Filters';
import type { TableColumn } from '@lib/types/Tables';
import { ActionDropdown } from '../../components/items/ActionDropdown';
import { ApiIcon } from '../../components/items/ApiIcon';
import { stockLocationFields } from '../../forms/StockForms';
import { InvenTreeIcon } from '../../functions/icons';
import {
  useBulkEditApiFormModal,
  useCreateApiFormModal,
  useDeleteApiFormModal,
  useEditApiFormModal
} from '../../hooks/UseForm';
import { useUserState } from '../../states/UserState';
import { BooleanColumn, DescriptionColumn } from '../ColumnRenderers';
import { InvenTreeTable } from '../InvenTreeTable';

/**
 * Stock location table
 */
export function StockLocationTable({ parentId }: Readonly<{ parentId?: any }>) {
  const table = useTable('stocklocation');
  const user = useUserState();

  // In-place drill-down: the location whose children are currently shown, plus
  // the breadcrumb path leading to it (so clicking a row opens its sublocations
  // rather than navigating away).
  const [activeParent, setActiveParent] = useState<number | undefined>(
    parentId
  );
  const [locationPath, setLocationPath] = useState<
    { pk: number; name: string }[]
  >([]);

  const tableFilters: TableFilter[] = useMemo(() => {
    return [
      {
        name: 'cascade',
        label: t`Include Sublocations`,
        description: t`Include sublocations in results`
      },
      {
        name: 'structural',
        label: t`Structural`,
        description: t`Show structural locations`
      },
      {
        name: 'external',
        label: t`External`,
        description: t`Show external locations`
      },
      {
        name: 'has_location_type',
        label: t`Has location type`
      },
      {
        name: 'location_type',
        label: t`Location Type`,
        description: t`Filter by location type`,
        apiUrl: apiUrl(ApiEndpoints.stock_location_type_list),
        model: ModelType.stocklocationtype,
        modelRenderer: (instance: any) => instance.name
      }
    ];
  }, []);

  const tableColumns: TableColumn[] = useMemo(() => {
    return [
      {
        accessor: 'name',
        switchable: false,
        copyable: true,
        render: (record: any) => (
          <Group gap='xs'>
            {record.icon && <ApiIcon name={record.icon} />}
            {record.name}
          </Group>
        )
      },
      DescriptionColumn({}),
      {
        accessor: 'pathstring',
        copyable: true,
        sortable: true
      },
      {
        accessor: 'items',
        sortable: true
      },
      BooleanColumn({
        accessor: 'structural',
        defaultVisible: false
      }),
      BooleanColumn({
        accessor: 'external',
        defaultVisible: false
      }),
      {
        accessor: 'location_type',
        sortable: false,
        filter: ['has_location_type', 'location_type'],
        render: (record: any) => record.location_type_detail?.name
      }
    ];
  }, []);

  const newLocation = useCreateApiFormModal({
    url: ApiEndpoints.stock_location_list,
    title: t`Add Stock Location`,
    fields: stockLocationFields(),
    focus: 'name',
    initialData: {
      parent: activeParent
    },
    follow: false,
    modelType: ModelType.stocklocation,
    table: table,
    keepOpenOption: true
  });

  const [selectedLocation, setSelectedLocation] = useState<number>(-1);

  const editLocation = useEditApiFormModal({
    url: ApiEndpoints.stock_location_list,
    pk: selectedLocation,
    title: t`Edit Stock Location`,
    fields: stockLocationFields(),
    onFormSuccess: (record: any) => table.updateRecord(record)
  });

  const deleteLocation = useDeleteApiFormModal({
    url: ApiEndpoints.stock_location_list,
    pk: selectedLocation,
    title: t`Delete Stock Location`,
    fields: {
      delete_stock_items: { hidden: true, field_type: 'boolean', value: false },
      delete_sub_locations: {
        hidden: true,
        field_type: 'boolean',
        value: false
      }
    },
    onFormSuccess: () => table.refreshTable()
  });

  const setParent = useBulkEditApiFormModal({
    url: ApiEndpoints.stock_location_list,
    items: table.selectedIds,
    title: t`Set Parent Location`,
    fields: {
      parent: {}
    },
    onFormSuccess: table.refreshTable
  });

  const tableActions = useMemo(() => {
    const can_add = user.hasAddRole(UserRoles.stock_location);
    const can_edit = user.hasChangeRole(UserRoles.stock_location);

    return [
      <ActionDropdown
        tooltip={t`Location Actions`}
        icon={<InvenTreeIcon icon='location' />}
        disabled={!table.hasSelectedRecords}
        actions={[
          {
            name: t`Set Parent`,
            icon: <InvenTreeIcon icon='location' />,
            tooltip: t`Set parent location for the selected items`,
            hidden: !can_edit,
            disabled: !table.hasSelectedRecords,
            onClick: () => {
              setParent.open();
            }
          }
        ]}
      />,
      <AddItemButton
        key='add-stock-location'
        tooltip={t`Add Stock Location`}
        onClick={() => newLocation.open()}
        hidden={!can_add}
      />
    ];
  }, [user, table.hasSelectedRecords]);

  const rowActions = useCallback(
    (record: any): RowAction[] => {
      const can_edit = user.hasChangeRole(UserRoles.stock_location);
      const can_delete = user.hasDeleteRole(UserRoles.stock_location);

      return [
        RowEditAction({
          hidden: !can_edit,
          onClick: () => {
            setSelectedLocation(record.pk);
            editLocation.open();
          }
        }),
        RowDeleteAction({
          hidden: !can_delete,
          onClick: () => {
            const itemCount = record.items ?? 0;
            const sublocationCount = record.sublocations ?? 0;

            if (itemCount > 0 || sublocationCount > 0) {
              notifications.show({
                title: t`Cannot Delete Location`,
                message: t`This stock location cannot be deleted, as it still contains stock items or sublocations. Move or delete its contents first.`,
                color: 'red'
              });
              return;
            }

            setSelectedLocation(record.pk);
            deleteLocation.open();
          }
        })
      ];
    },
    [user]
  );

  return (
    <>
      {newLocation.modal}
      {editLocation.modal}
      {deleteLocation.modal}
      {setParent.modal}
      <Stack gap='xs'>
        <Breadcrumbs>
          <Anchor
            onClick={() => {
              setActiveParent(undefined);
              setLocationPath([]);
            }}
          >
            {t`All Locations`}
          </Anchor>
          {locationPath.map((entry, index) => (
            <Anchor
              key={entry.pk}
              onClick={() => {
                setActiveParent(entry.pk);
                setLocationPath(locationPath.slice(0, index + 1));
              }}
            >
              {entry.name}
            </Anchor>
          ))}
        </Breadcrumbs>
        <InvenTreeTable
          url={apiUrl(ApiEndpoints.stock_location_list)}
          tableState={table}
          columns={tableColumns}
          props={{
            enableSelection: true,
            enableDownload: true,
            enableLabels: true,
            enableReports: true,
            params: {
              parent: activeParent,
              top_level: activeParent === undefined ? true : undefined
            },
            tableFilters: tableFilters,
            tableActions: tableActions,
            rowActions: rowActions,
            onRowClick: (record: any) => {
              setActiveParent(record.pk);
              setLocationPath((prev) => [
                ...prev,
                { pk: record.pk, name: record.name }
              ]);
            }
          }}
        />
      </Stack>
    </>
  );
}
