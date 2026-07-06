import { t } from '@lingui/core/macro';
import {
  ActionIcon,
  Flex,
  Group,
  LoadingOverlay,
  Paper,
  Skeleton,
  Stack,
  Tooltip
} from '@mantine/core';
import {
  IconCategory,
  IconInfoCircle,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconListCheck,
  IconListDetails,
  IconPackages,
  IconSitemap,
  IconTable
} from '@tabler/icons-react';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { StylishText } from '@lib/components/StylishText';
import { ApiEndpoints } from '@lib/enums/ApiEndpoints';
import { ModelType } from '@lib/enums/ModelType';
import { UserRoles } from '@lib/enums/Roles';
import { getDetailUrl } from '@lib/functions/Navigation';
import type { PanelType } from '@lib/types/Panel';
import { useLocalStorage } from '@mantine/hooks';
import AdminButton from '../../components/buttons/AdminButton';
import StarredToggleButton from '../../components/buttons/StarredToggleButton';
import SummaryStrip from '../../components/dashboard/SummaryStrip';
import {
  type DetailsField,
  DetailsTable
} from '../../components/details/Details';
import { ItemDetailsGrid } from '../../components/details/ItemDetails';
import {
  DeleteItemAction,
  EditItemAction,
  OptionsActionDropdown
} from '../../components/items/ActionDropdown';
import { ApiIcon } from '../../components/items/ApiIcon';
import InstanceDetail from '../../components/nav/InstanceDetail';
import NavigationTree from '../../components/nav/NavigationTree';
import { PageDetail } from '../../components/nav/PageDetail';
import { PanelGroup } from '../../components/panels/PanelGroup';
import ParametersPanel from '../../components/panels/ParametersPanel';
import SegmentedControlPanel from '../../components/panels/SegmentedControlPanel';
import { partCategoryFields } from '../../forms/PartForms';
import {
  useDeleteApiFormModal,
  useEditApiFormModal
} from '../../hooks/UseForm';
import { useInstance } from '../../hooks/UseInstance';
import { useUserSettingsState } from '../../states/SettingsStates';
import { useUserState } from '../../states/UserState';
import ParametricPartTable from '../../tables/part/ParametricPartTable';
import PartCategoryTemplateTable from '../../tables/part/PartCategoryTemplateTable';
import { PartListTable } from '../../tables/part/PartTable';
import { StockItemTable } from '../../tables/stock/StockItemTable';

/**
 * Detail view for a single PartCategory instance.
 *
 * Note: If no category ID is supplied, this acts as the top-level part category page
 */
export default function CategoryDetail() {
  const { id: _id } = useParams();
  const id = useMemo(
    () => (!Number.isNaN(Number.parseInt(_id || '')) ? _id : undefined),
    [_id]
  );

  const navigate = useNavigate();
  const user = useUserState();
  const settings = useUserSettingsState();

  const [filterOpen, setFilterOpen] = useLocalStorage<boolean>({
    key: 'part-category-filter-open',
    defaultValue: true,
    getInitialValueInEffect: false,
    sync: false
  });

  const {
    instance: category,
    refreshInstance,
    instanceQuery
  } = useInstance({
    endpoint: ApiEndpoints.category_list,
    hasPrimaryKey: true,
    pk: id,
    params: {
      path_detail: true
    }
  });

  const detailsPanel = useMemo(() => {
    if (id && instanceQuery.isFetching) {
      return <Skeleton />;
    }

    const left: DetailsField[] = [
      {
        type: 'text',
        name: 'name',
        label: t`Name`,
        copy: true,
        value_formatter: () => (
          <Group gap='xs'>
            {category.icon && <ApiIcon name={category.icon} />}
            {category.name}
          </Group>
        )
      },
      {
        type: 'text',
        name: 'pathstring',
        label: t`Path`,
        icon: 'sitemap',
        copy: true,
        hidden: !id
      },
      {
        type: 'text',
        name: 'description',
        label: t`Description`,
        copy: true
      },
      {
        type: 'link',
        name: 'parent',
        model_field: 'name',
        icon: 'location',
        label: t`Parent Category`,
        model: ModelType.partcategory,
        hidden: !category?.parent
      },
      {
        type: 'boolean',
        name: 'starred',
        icon: 'notification',
        label: t`Subscribed`
      }
    ];

    const right: DetailsField[] = [
      {
        type: 'text',
        name: 'part_count',
        label: t`Parts`,
        icon: 'part',
        value_formatter: () => category?.part_count || '0'
      },
      {
        type: 'text',
        name: 'subcategories',
        label: t`Subcategories`,
        icon: 'sitemap',
        hidden: !category?.subcategories
      },
      {
        type: 'boolean',
        name: 'structural',
        label: t`Structural`,
        icon: 'sitemap'
      },
      {
        type: 'link',
        name: 'parent_default_location',
        label: t`Parent default location`,
        model: ModelType.stocklocation,
        hidden: !category.parent_default_location || category.default_location
      },
      {
        type: 'link',
        name: 'default_location',
        label: t`Default location`,
        model: ModelType.stocklocation,
        hidden: !category.default_location
      }
    ];

    return (
      <ItemDetailsGrid>
        {id && category?.pk && <DetailsTable item={category} fields={left} />}
        {id && category?.pk && <DetailsTable item={category} fields={right} />}
      </ItemDetailsGrid>
    );
  }, [category, instanceQuery]);

  const editCategory = useEditApiFormModal({
    url: ApiEndpoints.category_list,
    pk: id,
    title: t`Edit Part Category`,
    fields: partCategoryFields({
      initialSeparateSheet: category?.export_as_separate_sheet
    }),
    onFormSuccess: refreshInstance
  });

  const deleteOptions = useMemo(() => {
    return [
      {
        value: 'false',
        display_name: t`Move items to parent category`
      },
      {
        value: 'true',
        display_name: t`Delete items`
      }
    ];
  }, []);

  const deleteCategory = useDeleteApiFormModal({
    url: ApiEndpoints.category_list,
    pk: id,
    title: t`Delete Part Category`,
    fields: {
      delete_parts: {
        label: t`Parts Action`,
        description: t`Action for parts in this category`,
        choices: deleteOptions,
        required: true,
        field_type: 'choice'
      },
      delete_child_categories: {
        label: t`Child Categories Action`,
        description: t`Action for child categories in this category`,
        choices: deleteOptions,
        required: true,
        field_type: 'choice'
      }
    },
    onFormSuccess: () => {
      if (category.parent) {
        navigate(getDetailUrl(ModelType.partcategory, category.parent));
      } else {
        navigate('/part/');
      }
    }
  });

  const categoryActions = useMemo(() => {
    return [
      <AdminButton
        key='admin'
        model={ModelType.partcategory}
        id={category.pk}
      />,
      <StarredToggleButton
        key='starred_change'
        instance={category}
        model={ModelType.partcategory}
        successFunction={() => {
          refreshInstance();
        }}
      />,
      <OptionsActionDropdown
        key='category-actions'
        tooltip={t`Category Actions`}
        actions={[
          EditItemAction({
            hidden: !id || !user.hasChangeRole(UserRoles.part_category),
            tooltip: t`Edit Part Category`,
            onClick: () => editCategory.open()
          }),
          DeleteItemAction({
            hidden: !id || !user.hasDeleteRole(UserRoles.part_category),
            tooltip: t`Delete Part Category`,
            onClick: () => deleteCategory.open()
          })
        ]}
      />
    ];
  }, [id, user, category.pk, category.starred]);

  const [partsView, setPartsView] = useLocalStorage<string>({
    key: 'category-parts-view',
    defaultValue: 'table'
  });

  const panels: PanelType[] = useMemo(
    () => [
      {
        name: 'details',
        label: t`Category Details`,
        icon: <IconInfoCircle />,
        content: detailsPanel,
        hidden: true
      },
      SegmentedControlPanel({
        name: 'parts',
        label: t`Parts`,
        icon: <IconCategory />,
        selection: partsView,
        onChange: setPartsView,
        options: [
          {
            value: 'table',
            label: t`Table View`,
            icon: <IconTable />,
            content: (
              <PartListTable
                props={{
                  params: {
                    category: id
                  }
                }}
              />
            )
          },
          {
            value: 'parametric',
            label: t`Parametric View`,
            icon: <IconListDetails />,
            content: <ParametricPartTable categoryId={id} />
          }
        ]
      }),
      {
        name: 'stockitem',
        label: t`Stock Items`,
        icon: <IconPackages />,
        hidden: !id,
        content: (
          <StockItemTable
            params={{
              category: id
            }}
            allowAdd={false}
            tableName='category-stockitems'
          />
        )
      },
      ParametersPanel({
        model_type: ModelType.partcategory,
        model_id: category?.pk,
        hidden: true
      }),
      {
        name: 'category_parameters',
        label: t`Parameter Templates`,
        icon: <IconListCheck />,
        hidden: true,
        content: <PartCategoryTemplateTable categoryId={category?.pk} />
      }
    ],
    [category, id, partsView]
  );

  const breadcrumbs = useMemo(
    () => [
      { name: t`Parts`, url: '/part' },
      ...(category.path ?? []).map((c: any) => ({
        name: c.name,
        url: getDetailUrl(ModelType.partcategory, c.pk),
        icon: c.icon ? <ApiIcon name={c.icon} /> : undefined
      }))
    ],
    [category]
  );

  const defaultPanel = useMemo(() => {
    if (
      settings.isSet('DISPLAY_ITEMS_FINAL_LEVEL', true) &&
      category.pk &&
      category.subcategories === 0
    ) {
      return 'parts';
    }
    return undefined;
  }, [settings, category]);

  return (
    <>
      {editCategory.modal}
      {deleteCategory.modal}
      <InstanceDetail
        query={instanceQuery}
        requiredRole={UserRoles.part_category}
      >
        <Flex align='flex-start' gap='sm' wrap='nowrap'>
          {filterOpen ? (
            <Paper withBorder p='xs' style={{ width: 280, flexShrink: 0 }}>
              <Group justify='space-between' wrap='nowrap' mb='xs'>
                <Group gap='xs' wrap='nowrap'>
                  <IconSitemap size={18} />
                  <StylishText size='sm'>{t`Filter by Category`}</StylishText>
                </Group>
                <Tooltip label={t`Hide category filter`} position='right'>
                  <ActionIcon
                    variant='subtle'
                    onClick={() => setFilterOpen(false)}
                    aria-label='collapse-category-filter'
                  >
                    <IconLayoutSidebarLeftCollapse />
                  </ActionIcon>
                </Tooltip>
              </Group>
              <NavigationTree
                inline
                modelType={ModelType.partcategory}
                title={t`Part Categories`}
                endpoint={ApiEndpoints.category_tree}
                childIdentifier='subcategories'
                selectedId={category?.pk}
              />
            </Paper>
          ) : (
            <Tooltip label={t`Show category filter`} position='right'>
              <ActionIcon
                variant='subtle'
                mt='xs'
                onClick={() => setFilterOpen(true)}
                aria-label='expand-category-filter'
              >
                <IconLayoutSidebarLeftExpand />
              </ActionIcon>
            </Tooltip>
          )}
          <Stack gap='xs' style={{ flexGrow: 1, minWidth: 0 }}>
            <LoadingOverlay visible={instanceQuery.isFetching} />
            <PageDetail
              title={(category?.name ?? id) ? t`Part Category` : t`Parts`}
              subtitle={category?.description}
              icon={category?.icon && <ApiIcon name={category?.icon} />}
              breadcrumbs={category?.pk ? breadcrumbs : []}
              breadcrumbAction={() => {
                setFilterOpen(true);
              }}
              actions={categoryActions}
              editAction={editCategory.open}
              editEnabled={
                !!category?.pk &&
                user.hasChangePermission(ModelType.partcategory)
              }
            />
            {!category?.pk && (
              <SummaryStrip
                metrics={[
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
                  }
                ]}
              />
            )}
            <PanelGroup
              pageKey='partcategory'
              panels={panels}
              model={ModelType.partcategory}
              instance={category}
              reloadInstance={refreshInstance}
              id={category.pk ?? null}
              defaultPanel={defaultPanel}
            />
          </Stack>
        </Flex>
      </InstanceDetail>
    </>
  );
}
