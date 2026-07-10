import type { ApiFormFieldSet } from '@lib/types/Forms';
import { t } from '@lingui/core/macro';
import { IconBuildingStore, IconCopy, IconPackages } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { useGlobalSettingsState } from '../states/SettingsStates';
import { TagsField } from './CommonFields';

/**
 * Construct a set of fields for creating / editing a Part instance
 */
export function usePartFields({
  create = false,
  partId,
  duplicatePartInstance
}: {
  partId?: number;
  duplicatePartInstance?: any;
  create?: boolean;
}): ApiFormFieldSet {
  const globalSettings = useGlobalSettingsState();

  const [virtual, setVirtual] = useState<boolean | undefined>(undefined);
  const [purchaseable, setPurchaseable] = useState<boolean | undefined>(
    undefined
  );

  // Set the initial state for the tracked fields based on the global settings
  useEffect(() => {
    setVirtual(globalSettings.isSet('PART_VIRTUAL'));
    setPurchaseable(globalSettings.isSet('PART_PURCHASEABLE'));
  }, [partId, create]);

  return useMemo(() => {
    const fields: ApiFormFieldSet = {
      category: {
        filters: {
          structural: false
        }
      },
      name: {},
      IPN: {},
      description: {},
      // Asset Classification is a key field for the team - show it high up,
      // immediately after the description.
      asset_classification: {},
      // --- Fields below are hidden for this deployment (kept for future use).
      // To re-show any field, remove its `hidden: true` entry.
      revision: {
        hidden: true
      },
      revision_of: {
        hidden: true,
        filters: {
          is_template: false,
          assembly: globalSettings.isSet('PART_REVISION_ASSEMBLY_ONLY')
            ? true
            : undefined
        }
      },
      variant_of: {
        hidden: true,
        filters: {
          is_template: true
        }
      },
      keywords: {},
      tags: {
        ...TagsField({}),
        hidden: true
      },
      units: {
        hidden: true
      },
      link: {
        hidden: true
      },
      default_location: {
        filters: {
          structural: false
        }
      },
      default_expiry: {
        hidden: true
      },
      minimum_stock: {},
      maximum_stock: {
        hidden: true
      },
      responsible: {
        filters: {
          is_active: true
        }
      },
      asset_owner: {},
      component: {
        hidden: true,
        default: globalSettings.isSet('PART_COMPONENT')
      },
      assembly: {
        hidden: true,
        default: globalSettings.isSet('PART_ASSEMBLY')
      },
      is_template: {
        hidden: true,
        default: globalSettings.isSet('PART_TEMPLATE')
      },
      testable: {
        hidden: true,
        default: false
      },
      trackable: {
        default: globalSettings.isSet('PART_TRACKABLE')
      },
      purchaseable: {
        value: purchaseable,
        default: globalSettings.isSet('PART_PURCHASEABLE'),
        onValueChange: (value: boolean) => {
          setPurchaseable(value);
        }
      },
      salable: {
        hidden: true,
        default: globalSettings.isSet('PART_SALABLE')
      },
      virtual: {
        default: globalSettings.isSet('PART_VIRTUAL'),
        value: virtual,
        onValueChange: (value: boolean) => {
          setVirtual(value);
        }
      },
      locked: {
        hidden: true
      },
      active: {},
      starred: {
        hidden: true,
        field_type: 'boolean',
        label: t`Subscribed`,
        description: t`Subscribe to notifications for this part`,
        disabled: false,
        required: false
      }
    };

    // Additional fields for creation
    if (create && !virtual) {
      fields.copy_category_parameters = { hidden: true };

      // Show the initial stock section for non-virtual parts. (Upstream InvenTree
      // wraps this in `if (virtual != false)`, which contradicts the outer
      // `!virtual` check and hides the section entirely — corrected here.)
      fields.initial_stock = {
        icon: <IconPackages />,
        children: {
          quantity: {
            value: 0
          },
          location: {}
        }
      };

      if (purchaseable) {
        fields.initial_supplier = {
          hidden: true,
          icon: <IconBuildingStore />,
          children: {
            supplier: {
              filters: {
                is_supplier: true
              }
            },
            sku: {},
            manufacturer: {
              filters: {
                is_manufacturer: true
              }
            },
            mpn: {}
          }
        };
      }
    }

    // Additional fields for part duplication
    if (create && duplicatePartInstance?.pk) {
      fields.duplicate = {
        icon: <IconCopy />,
        children: {
          part: {
            value: duplicatePartInstance?.pk,
            hidden: true
          },
          copy_image: {
            value: true
          },
          copy_bom: {
            value: globalSettings.isSet('PART_COPY_BOM'),
            hidden: !duplicatePartInstance?.assembly
          },
          copy_notes: {
            value: true
          },
          copy_parameters: {
            value: globalSettings.isSet('PART_COPY_PARAMETERS')
          },
          copy_tests: {
            value: true,
            hidden: !duplicatePartInstance?.testable
          }
        }
      };
    }

    if (globalSettings.isSet('PART_REVISION_ASSEMBLY_ONLY')) {
      fields.revision_of.filters['assembly'] = true;
    }

    // Pop 'revision' field if PART_ENABLE_REVISION is False
    if (!globalSettings.isSet('PART_ENABLE_REVISION')) {
      delete fields['revision'];
      delete fields['revision_of'];
    }

    // Pop 'expiry' field if expiry not enabled
    if (!globalSettings.isSet('STOCK_ENABLE_EXPIRY')) {
      delete fields['default_expiry'];
    }

    // Remove "locked" field if locking not enabled
    if (!globalSettings.isSet('PART_ENABLE_LOCKING')) {
      delete fields['locked'];
    }

    if (create) {
      delete fields['starred'];
    }

    return fields;
  }, [
    partId,
    virtual,
    purchaseable,
    create,
    globalSettings,
    duplicatePartInstance
  ]);
}

/**
 * Construct a set of fields for creating / editing a PartCategory instance
 */
export function partCategoryFields({
  create,
  initialSeparateSheet
}: {
  create?: boolean;
  initialSeparateSheet?: boolean;
}): ApiFormFieldSet {
  // Track the "export as separate sheet" toggle so the merge-target dropdown
  // can be shown only when it is turned off.
  const [separateSheet, setSeparateSheet] = useState<boolean>(
    initialSeparateSheet ?? true
  );

  // Seed the toggle state from the loaded instance value (edit forms), since
  // onValueChange does not fire on initial load.
  useEffect(() => {
    if (initialSeparateSheet !== undefined) {
      setSeparateSheet(initialSeparateSheet);
    }
  }, [initialSeparateSheet]);

  const fields: ApiFormFieldSet = useMemo(() => {
    const fields: ApiFormFieldSet = {
      parent: {
        description: t`Parent part category`,
        required: false
      },
      name: {},
      description: {},
      default_location: {
        filters: {
          structural: false
        }
      },
      default_keywords: {},
      structural: {},
      export_as_separate_sheet: {
        onValueChange: (value: boolean) => {
          setSeparateSheet(value);
        }
      },
      export_with_category: {
        hidden: separateSheet,
        required: !separateSheet,
        filters: {
          structural: false
        }
      },
      starred: {
        field_type: 'boolean',
        label: t`Subscribed`,
        description: t`Subscribe to notifications for this category`,
        disabled: false,
        required: false
      },
      icon: {
        field_type: 'icon'
      }
    };

    if (create) {
      delete fields['starred'];
    }

    return fields;
  }, [create, separateSheet]);

  return fields;
}

export function partStocktakeFields(): ApiFormFieldSet {
  return {
    part: {
      hidden: true
    },
    quantity: {},
    item_count: {},
    cost_min: {},
    cost_min_currency: {},
    cost_max: {},
    cost_max_currency: {}
  };
}
