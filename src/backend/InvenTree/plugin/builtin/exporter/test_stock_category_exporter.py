"""Unit test for the stock category exporter plugin."""

import io

from django.urls import reverse

import openpyxl

from InvenTree.unit_test import InvenTreeAPITestCase
from plugin.registry import registry


class StockCategoryExporterTest(InvenTreeAPITestCase):
    """Test the multi-sheet (per-category) stock exporter plugin."""

    fixtures = ['category', 'part', 'location', 'stock', 'company']
    roles = ['stock.view']

    SLUG = 'inventree-stock-category-exporter'

    def setUp(self):
        """Create deterministic data: one serialized and one bulk category."""
        super().setUp()

        from part.models import Part, PartCategory
        from stock.models import StockItem

        # A category whose items are all serialized
        self.cat_serial = PartCategory.objects.create(name='ZZ Serialized Widgets')
        part_serial = Part.objects.create(
            name='ZZ Widget', category=self.cat_serial, component=True, trackable=True
        )
        StockItem.objects.create(part=part_serial, serial='SN-1', quantity=1)
        StockItem.objects.create(part=part_serial, serial='SN-2', quantity=1)

        # A category whose items are bulk (quantity only)
        self.cat_bulk = PartCategory.objects.create(name='ZZ Bulk Gadgets')
        part_bulk = Part.objects.create(
            name='ZZ Gadget', category=self.cat_bulk, component=True
        )
        StockItem.objects.create(part=part_bulk, quantity=25)

    def _header(self, worksheet) -> list:
        """Return the header row (first row) of a worksheet."""
        return [cell.value for cell in next(worksheet.iter_rows(max_row=1))]

    def test_multisheet_export(self):
        """Export stock as xlsx grouped by category and validate the workbook."""
        registry.set_plugin_state(self.SLUG, True)

        url = reverse('api-stock-list')

        with self.export_data(
            url, export_plugin=self.SLUG, export_format='xlsx', decode=False
        ) as data_file:
            self.assertIsInstance(data_file, io.BytesIO)

            workbook = openpyxl.load_workbook(data_file)

            # Our two deterministic categories each produce a sheet
            self.assertGreater(len(workbook.sheetnames), 1)
            self.assertIn('ZZ Serialized Widgets', workbook.sheetnames)
            self.assertIn('ZZ Bulk Gadgets', workbook.sheetnames)

            # Sheet names must be unique (case-insensitive) and <= 31 chars
            lowered = [name.lower() for name in workbook.sheetnames]
            self.assertEqual(len(lowered), len(set(lowered)))
            for name in workbook.sheetnames:
                self.assertLessEqual(len(name), 31)
                # Every sheet carries the injected 'Category' column
                self.assertIn('Category', self._header(workbook[name]))

            # Serialized category: Serial Number column, no Quantity column
            serial_header = self._header(workbook['ZZ Serialized Widgets'])
            self.assertIn('Serial Number', serial_header)
            self.assertNotIn('Quantity', serial_header)

            # Bulk category: Quantity column, no Serial Number column
            bulk_header = self._header(workbook['ZZ Bulk Gadgets'])
            self.assertIn('Quantity', bulk_header)
            self.assertNotIn('Serial Number', bulk_header)

        # Selecting the plugin with a non-xlsx format must fall back cleanly
        # to a normal single-sheet file (still including the Category column).
        with self.export_data(
            url, export_plugin=self.SLUG, export_format='csv'
        ) as data_file:
            self.process_csv(data_file, required_cols=['Category'])

        registry.set_plugin_state(self.SLUG, False)
