import { t } from '@lingui/core/macro';
import { useCallback, useMemo, useState } from 'react';

import { AddItemButton } from '@lib/components/AddItemButton';
import {
  type RowAction,
  RowDeleteAction,
  RowEditAction
} from '@lib/components/RowActions';
import { ApiEndpoints } from '@lib/enums/ApiEndpoints';
import { UserRoles } from '@lib/enums/Roles';
import { apiUrl } from '@lib/functions/Api';
import useTable from '@lib/hooks/UseTable';
import type { TableFilter } from '@lib/index';
import type { ApiFormFieldSet } from '@lib/types/Forms';
import type { TableColumn } from '@lib/types/Tables';
import {
  useCreateApiFormModal,
  useDeleteApiFormModal,
  useEditApiFormModal
} from '../../hooks/UseForm';
import { useUserState } from '../../states/UserState';
import { BooleanColumn, DescriptionColumn } from '../ColumnRenderers';
import { InvenTreeTable } from '../InvenTreeTable';

/**
 * Form fields for creating / editing a Department.
 */
function departmentFields(): ApiFormFieldSet {
  return {
    name: {},
    description: {},
    active: {}
  };
}

/**
 * Table for displaying and managing the list of departments.
 *
 * These are the options shown in the department dropdowns on purchase orders
 * and purchase order line items.
 */
export default function DepartmentTable() {
  const table = useTable('departments');

  const user = useUserState();

  const columns: TableColumn[] = useMemo(() => {
    return [
      {
        accessor: 'name',
        sortable: true
      },
      DescriptionColumn({}),
      BooleanColumn({
        accessor: 'active'
      })
    ];
  }, []);

  const newDepartment = useCreateApiFormModal({
    url: ApiEndpoints.department_list,
    title: t`Add Department`,
    fields: departmentFields(),
    table: table
  });

  const [selectedDepartment, setSelectedDepartment] = useState<
    number | undefined
  >(undefined);

  const editDepartment = useEditApiFormModal({
    url: ApiEndpoints.department_list,
    pk: selectedDepartment,
    title: t`Edit Department`,
    fields: departmentFields(),
    table: table
  });

  const deleteDepartment = useDeleteApiFormModal({
    url: ApiEndpoints.department_list,
    pk: selectedDepartment,
    title: t`Delete Department`,
    table: table
  });

  const rowActions = useCallback(
    (record: any): RowAction[] => {
      return [
        RowEditAction({
          hidden: !user.hasChangeRole(UserRoles.admin),
          onClick: () => {
            setSelectedDepartment(record.pk);
            editDepartment.open();
          }
        }),
        RowDeleteAction({
          hidden: !user.hasDeleteRole(UserRoles.admin),
          onClick: () => {
            setSelectedDepartment(record.pk);
            deleteDepartment.open();
          }
        })
      ];
    },
    [user]
  );

  const tableFilters: TableFilter[] = useMemo(() => {
    return [
      {
        name: 'active',
        label: t`Active`,
        description: t`Show active departments`,
        type: 'boolean'
      }
    ];
  }, []);

  const tableActions = useMemo(() => {
    return [
      <AddItemButton
        key='add'
        onClick={() => newDepartment.open()}
        tooltip={t`Add department`}
      />
    ];
  }, []);

  return (
    <>
      {newDepartment.modal}
      {editDepartment.modal}
      {deleteDepartment.modal}
      <InvenTreeTable
        url={apiUrl(ApiEndpoints.department_list)}
        tableState={table}
        columns={columns}
        props={{
          rowActions: rowActions,
          tableActions: tableActions,
          tableFilters: tableFilters,
          enableDownload: true
        }}
      />
    </>
  );
}
