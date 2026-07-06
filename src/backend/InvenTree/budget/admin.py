"""Admin registration for the budget app."""

from django.contrib import admin

from budget.models import PurchaseRecord


@admin.register(PurchaseRecord)
class PurchaseRecordAdmin(admin.ModelAdmin):
    """Admin interface for PurchaseRecord."""

    list_display = [
        'date',
        'item',
        'budget_type',
        'department',
        'supplier',
        'total_cost_base',
    ]
    list_filter = ['budget_type', 'department', 'source']
    search_fields = ['item', 'department', 'supplier']
