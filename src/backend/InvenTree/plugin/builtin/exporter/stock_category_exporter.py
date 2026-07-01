"""Custom data exporter: multi-sheet stock export grouped by part category.

Produces an xlsx workbook with one worksheet per part category. The actual
multi-sheet file is written by ``StockItemSerializer.export_to_file``, which
delegates to ``stock.exporter_helpers.build_category_workbook`` when this
plugin is selected together with the xlsx format.
"""

from django.utils.translation import gettext_lazy as _

from InvenTree.helpers import current_date
from plugin import InvenTreePlugin
from plugin.mixins import DataExportMixin
from stock.exporter_helpers import CATEGORY_ID_KEY, CATEGORY_NAME_KEY, CATEGORY_PATH_KEY
from stock.models import StockItem
from stock.serializers import StockItemSerializer


class StockCategoryExporter(DataExportMixin, InvenTreePlugin):
    """Builtin plugin for exporting stock items grouped by part category.

    Each part category is written to its own worksheet in the exported xlsx file.
    """

    NAME = 'Stock Category Exporter'
    SLUG = 'inventree-stock-category-exporter'
    TITLE = _('Stock Category Exporter')
    DESCRIPTION = _('Export stock items grouped into one Excel sheet per part category')
    VERSION = '1.0.0'
    AUTHOR = _('InvenTree contributors')

    def supports_export(
        self,
        model_class: type,
        user=None,
        serializer_class=None,
        view_class=None,
        *args,
        **kwargs,
    ) -> bool:
        """Supported only for the StockItem model."""
        return model_class == StockItem and serializer_class == StockItemSerializer

    def generate_filename(self, model_class, export_format: str) -> str:
        """Generate a filename for the exported data."""
        date = current_date().isoformat()
        return f'InvenTree_Stock_ByCategory_{date}.{export_format}'

    def filter_queryset(self, queryset):
        """Prefetch the related part category to avoid extra queries."""
        return queryset.select_related('part', 'part__category')

    def update_headers(self, headers, context, **kwargs):
        """Add a 'Category' column to the export headers."""
        headers[CATEGORY_NAME_KEY] = _('Category')
        return headers

    def export_data(
        self, queryset, serializer_class, headers, context, output, **kwargs
    ):
        """Serialize each stock item and attach its part category.

        Rows are serialized in chunks (matching the default exporter) and, within
        each chunk, zipped back to their source objects so the category can be
        attached to every row for later grouping.
        """
        serializer_context = kwargs.get('serializer_context') or {}

        output.refresh_from_db()

        rows = []
        offset = 0
        total = queryset.count()

        while offset < total:
            chunk = list(queryset[offset : offset + self.EXPORT_CHUNK_SIZE])

            chunk_rows = serializer_class(
                chunk, many=True, exporting=True, context=serializer_context
            ).data

            for item, row in zip(chunk, chunk_rows, strict=False):
                category = item.part.category if item.part_id else None

                row[CATEGORY_ID_KEY] = category.pk if category else 0
                row[CATEGORY_NAME_KEY] = (
                    category.name if category else _('Uncategorized')
                )
                row[CATEGORY_PATH_KEY] = (
                    category.pathstring if category else _('Uncategorized')
                )

                rows.append(row)

            offset += self.EXPORT_CHUNK_SIZE

            # Update export progress
            output.progress += len(chunk_rows)
            output.save()

        return rows
