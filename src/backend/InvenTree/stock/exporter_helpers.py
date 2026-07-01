"""Helper functions for building multi-sheet stock exports.

Used by the 'Stock Category Exporter' plugin to produce an xlsx workbook with
one worksheet per part category.
"""

import re

import tablib

# Keys injected into each exported row by the stock category exporter plugin.
# CATEGORY_ID_KEY is used purely for grouping into sheets; the others are also
# surfaced as columns via the plugin's curated header set.
CATEGORY_ID_KEY = 'part_category_id'
CATEGORY_NAME_KEY = 'part_category_name'
CATEGORY_PATH_KEY = 'part_category_path'

# Keys injected for the location name/path (resolved from the stock item).
LOCATION_NAME_KEY = 'stock_location_name'
LOCATION_PATH_KEY = 'stock_location_path'

# Characters which are not permitted in an Excel worksheet title.
_INVALID_SHEET_CHARS = re.compile(r'[\[\]:*?/\\]')

# Maximum length of an Excel worksheet title.
_MAX_SHEET_NAME = 31


def _safe_sheet_name(raw: str, used: set) -> str:
    r"""Return an Excel-safe, unique worksheet name.

    Excel worksheet titles must be <= 31 characters, cannot contain the
    characters []:*?/\\, cannot be blank, and must be unique (case-insensitive).
    """
    name = _INVALID_SHEET_CHARS.sub('_', str(raw or 'Uncategorized')).strip()
    name = name[:_MAX_SHEET_NAME] or 'Uncategorized'

    base = name
    counter = 1

    while name.lower() in used:
        suffix = f'_{counter}'
        name = base[: _MAX_SHEET_NAME - len(suffix)] + suffix
        counter += 1

    used.add(name.lower())
    return name


def build_category_workbook(serializer, data: list, headers) -> bytes:
    """Build a multi-sheet xlsx workbook, one worksheet per part category.

    Arguments:
        serializer: The export serializer instance (provides get_nested_value)
        data: A list of row dicts, each carrying the category grouping keys
        headers: An OrderedDict of {field_name: label} describing the columns

    Returns:
        bytes: The exported xlsx file contents

    Notes:
        - Rows are grouped by category id; the sheet title is the category name.
        - Columns are pruned per sheet: fully serialized categories drop the
          'quantity' column, and categories with no serials drop the 'serial'
          column. This mirrors the serialized-vs-bulk layout of the reference.
    """
    book = tablib.Databook()

    # Group rows by category id, retaining a display label for each group.
    groups: dict = {}

    for row in data:
        key = row.get(CATEGORY_ID_KEY, 0)

        if key not in groups:
            groups[key] = {
                'label': row.get(CATEGORY_NAME_KEY) or 'Uncategorized',
                'rows': [],
            }

        groups[key]['rows'].append(row)

    # Guard: openpyxl requires at least one worksheet in the workbook.
    if not groups:
        empty = tablib.Dataset(headers=list(headers.values()))
        empty.title = 'Stock'
        book.add_sheet(empty)
        return book.export('xlsx')

    all_fields = list(headers.keys())
    used_names: set = set()

    # Sort sheets alphabetically by category name for a tidy workbook.
    for key in sorted(groups, key=lambda k: str(groups[k]['label']).lower()):
        group = groups[key]
        rows = group['rows']

        # Per-sheet column selection: serialized vs bulk.
        any_serial = any(r.get('serial') not in (None, '') for r in rows)
        all_serial = bool(rows) and all(r.get('serial') not in (None, '') for r in rows)

        fields = []

        for field in all_fields:
            if field == 'quantity' and all_serial:
                continue
            if field == 'serial' and not any_serial:
                continue
            fields.append(field)

        dataset = tablib.Dataset(headers=[headers[f] for f in fields])
        dataset.title = _safe_sheet_name(group['label'], used_names)

        for row in rows:
            dataset.append([serializer.get_nested_value(row, f) for f in fields])

        book.add_sheet(dataset)

    return book.export('xlsx')
