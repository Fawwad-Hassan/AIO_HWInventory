import type { ApiFormFieldType } from '@lib/types/Forms';
import { t } from '@lingui/core/macro';
import { Text } from '@mantine/core';
import { IconBuilding, IconList } from '@tabler/icons-react';

export function TagsField({
  label,
  description,
  placeholder
}: Readonly<{
  label?: string;
  description?: string;
  placeholder?: string;
}>): ApiFormFieldType {
  return {
    field_type: 'tags',
    label: label ?? t`Tags`,
    description: description ?? t`Tags for this item`,
    placeholder: placeholder ?? t`Select tags`
  };
}

export function ProjectCodeField(): ApiFormFieldType {
  return {
    filters: {
      active: true
    },
    label: t`Project Code`,
    description: t`Select project code for this item`,
    icon: <IconList />
  };
}

/**
 * Dropdown field for selecting a Department (a custom, admin-managed list).
 *
 * Department is not a registered frontend model type, so we supply a custom
 * renderer to display the department name in the dropdown.
 */
export function DepartmentField(): ApiFormFieldType {
  return {
    filters: {
      active: true
    },
    label: t`Department`,
    description: t`Select the department or purpose for this purchase`,
    icon: <IconBuilding />,
    modelRenderer: ({ instance }: { instance: any }) => (
      <Text>{instance?.name ?? ''}</Text>
    )
  };
}
