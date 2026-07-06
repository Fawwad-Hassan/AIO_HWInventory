"""Sync completed purchase orders into budget purchase records.

When a PurchaseOrder is completed, one PurchaseRecord is created per line item
so that real purchases flow automatically into the budget tracker. The sync is
idempotent: it removes any previously auto-generated records for the order and
recreates them from the current line items, so it can safely run again whenever
the order (or one of its lines) changes.
"""

import structlog
from djmoney.contrib.exchange.models import convert_money
from djmoney.money import Money

logger = structlog.get_logger('inventree')

# Marker stored on auto-generated PurchaseRecords (distinguishes them from
# historical / manually-entered records).
PO_SOURCE = 'purchase_order'


def sync_purchase_order_records(purchase_order):
    """Create or refresh budget purchase records for a purchase order.

    - Deletes any existing auto-generated records for this order.
    - If the order is complete, creates one record per line item.
    """
    import InvenTree.helpers
    from budget.models import PurchaseRecord
    from common.currency import currency_code_default
    from order.status_codes import PurchaseOrderStatus

    if not purchase_order or not purchase_order.pk:
        return

    # Remove any previously auto-generated records for this order
    PurchaseRecord.objects.filter(
        purchase_order=purchase_order, source=PO_SOURCE
    ).delete()

    # Only completed orders produce budget records
    if purchase_order.status != PurchaseOrderStatus.COMPLETE.value:
        return

    base_currency = currency_code_default()
    supplier_name = purchase_order.supplier.name if purchase_order.supplier else ''
    date = (
        purchase_order.complete_date
        or purchase_order.creation_date
        or InvenTree.helpers.current_date()
    )

    count = 0

    for line in purchase_order.lines.all():
        part = line.get_base_part()
        if part:
            item_name = part.name
        elif line.part:
            item_name = line.part.SKU
        else:
            item_name = 'Unknown item'

        qty = line.quantity or 0

        price = line.purchase_price
        if price is not None:
            unit_amount = price.amount
            currency = str(price.currency)
        else:
            unit_amount = 0
            currency = base_currency

        total_amount = unit_amount * qty

        # Convert the total into the base currency for reporting
        base_amount = total_amount
        if total_amount and currency != base_currency:
            try:
                base_amount = convert_money(
                    Money(total_amount, currency), base_currency
                ).amount
            except Exception:
                logger.warning(
                    'Could not convert %s %s to %s for PO %s',
                    total_amount,
                    currency,
                    base_currency,
                    purchase_order.reference,
                )
                base_amount = total_amount

        PurchaseRecord.objects.create(
            date=date,
            item=str(item_name)[:250],
            department=line.department.name if line.department else '',
            budget_type=line.budget_type or PurchaseRecord.BudgetType.RECURRING,
            supplier=str(supplier_name)[:150],
            quantity=qty,
            unit_cost=unit_amount,
            total_cost=total_amount,
            currency=currency,
            total_cost_base=base_amount,
            purchase_order=purchase_order,
            source=PO_SOURCE,
        )
        count += 1

    logger.info('Synced %s budget record(s) for PO %s', count, purchase_order.reference)


def handle_purchase_order_saved(sender, instance, **kwargs):
    """Signal handler: re-sync budget records when a purchase order is saved."""
    try:
        sync_purchase_order_records(instance)
    except Exception:
        logger.exception('Failed to sync budget records for purchase order')


def handle_line_item_changed(sender, instance, **kwargs):
    """Signal handler: re-sync when a line item is saved or deleted."""
    order_id = getattr(instance, 'order_id', None)
    if not order_id:
        return

    from order.models import PurchaseOrder

    order = PurchaseOrder.objects.filter(pk=order_id).first()
    if order:
        try:
            sync_purchase_order_records(order)
        except Exception:
            logger.exception('Failed to sync budget records for purchase order')
