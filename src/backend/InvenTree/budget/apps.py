"""App configuration for the custom budget app.

This app provides a lightweight purchase-record store used for budget tracking
and spend analysis, decoupled from the full PurchaseOrder workflow.
"""

from django.apps import AppConfig


class BudgetConfig(AppConfig):
    """Configuration for the budget app."""

    name = 'budget'
    default_auto_field = 'django.db.models.BigAutoField'
