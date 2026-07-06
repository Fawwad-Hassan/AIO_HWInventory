"""App configuration for the custom budget app.

This app provides a lightweight purchase-record store used for budget tracking
and spend analysis, decoupled from the full PurchaseOrder workflow.
"""

from django.apps import AppConfig


class BudgetConfig(AppConfig):
    """Configuration for the budget app."""

    name = 'budget'
    default_auto_field = 'django.db.models.BigAutoField'

    def ready(self):
        """Connect signals that sync completed purchase orders into budget records."""
        from django.db.models.signals import post_delete, post_save

        from budget.sync import handle_line_item_changed, handle_purchase_order_saved

        # Imported here (not at module load) to avoid early model imports
        from order.models import PurchaseOrder, PurchaseOrderLineItem

        post_save.connect(
            handle_purchase_order_saved,
            sender=PurchaseOrder,
            dispatch_uid='budget_sync_po_saved',
        )
        post_save.connect(
            handle_line_item_changed,
            sender=PurchaseOrderLineItem,
            dispatch_uid='budget_sync_line_saved',
        )
        post_delete.connect(
            handle_line_item_changed,
            sender=PurchaseOrderLineItem,
            dispatch_uid='budget_sync_line_deleted',
        )
