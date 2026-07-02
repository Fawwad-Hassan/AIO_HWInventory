import { randomId, useLocalStorage } from '@mantine/hooks';
import { useCallback, useMemo, useState } from 'react';

import type { FilterSetState, TableFilter } from '../types/Filters';
import type { TableState } from '../types/Tables';
import useFilterSet from './UseFilterSet';

export type TableStateExtraProps = {
  idAccessor?: string;
  initialFilters?: TableFilter[];
};

/**
 * A custom hook for managing the state of an <InvenTreeTable> component.
 *
 * Refer to the TableState type definition for more information.
 */

export default function useTable(
  tableName: string,
  tableProps: TableStateExtraProps = {
    idAccessor: 'pk',
    initialFilters: []
  }
): TableState {
  // Function to generate a new ID (to refresh the table)
  function generateTableName() {
    return `${tableName.replaceAll('-', '')}-${randomId()}`;
  }

  const [tableKey, setTableKey] = useState<string>(generateTableName());

  // Callback used to refresh (reload) the table
  const refreshTable = useCallback(
    (clearSelection?: boolean) => {
      setTableKey(generateTableName());
      if (clearSelection) {
        clearSelectedRecords();
      }
    },
    [generateTableName]
  );

  const filterSet: FilterSetState = useFilterSet(
    `table-${tableName}`,
    tableProps.initialFilters
  );

  // Array of expanded records
  const [expandedRecords, setExpandedRecords] = useState<any[]>([]);

  // Function to determine if a record is expanded
  const isRowExpanded = useCallback(
    (pk: number) => {
      return expandedRecords.includes(pk);
    },
    [expandedRecords]
  );

  // Array of columns which are hidden
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  // Array of selected records
  const [selectedRecords, setSelectedRecords] = useState<any[]>([]);

  // Array of selected primary key values
  const selectedIds = useMemo(
    () => selectedRecords.map((r) => r[tableProps.idAccessor || 'pk']),
    [selectedRecords]
  );

  const clearSelectedRecords = useCallback(() => {
    setSelectedRecords([]);
  }, []);

  const hasSelectedRecords = useMemo(() => {
    return selectedRecords.length > 0;
  }, [selectedRecords]);

  // Total record count
  const [recordCount, setRecordCount] = useState<number>(0);

  // Persist the active page per-table (keyed by table name) so that navigating
  // into a detail view and back restores the page the user was on.
  const [page, setPage] = useLocalStorage<number>({
    key: `inventree-table-page-${tableName}`,
    defaultValue: 1,
    getInitialValueInEffect: false,
    sync: false
  });

  // Persist the search term per-table (same rationale as the page number).
  const [searchTerm, setSearchTerm] = useLocalStorage<string>({
    key: `inventree-table-search-${tableName}`,
    defaultValue: '',
    getInitialValueInEffect: false,
    sync: false
  });

  // Table records
  const [records, setRecords] = useState<any[]>([]);

  // Update a single record in the table, by primary key value
  const updateRecord = useCallback(
    (record: any) => {
      const _records = [...records];

      // Find the matching record in the table
      const index = _records.findIndex(
        (r) => r[tableProps.idAccessor || 'pk'] === record.pk
      );

      if (index >= 0) {
        _records[index] = {
          ..._records[index],
          ...record
        };
      } else {
        _records.push(record);
      }

      setRecords(_records);
    },
    [records]
  );

  const idAccessor = useMemo(
    () => tableProps.idAccessor || 'pk',
    [tableProps.idAccessor]
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);

  return {
    tableKey,
    refreshTable,
    isLoading,
    setIsLoading,
    filterSet,
    expandedRecords,
    setExpandedRecords,
    isRowExpanded,
    selectedRecords,
    selectedIds,
    setSelectedRecords,
    clearSelectedRecords,
    hasSelectedRecords,
    searchTerm,
    setSearchTerm,
    recordCount,
    setRecordCount,
    hiddenColumns,
    setHiddenColumns,
    page,
    setPage,
    records,
    setRecords,
    updateRecord,
    idAccessor
  };
}
