"""Models for the budget app.

A lightweight record of a purchase, used for budget tracking and spend analysis.
Intentionally decoupled from the full PurchaseOrder workflow so that historical
spend and quick manual entries can be logged. A record may optionally be linked
to a real PurchaseOrder (the hook for future integration).
"""

from django.db import models
from django.urls import reverse
from django.utils.translation import gettext_lazy as _


class Department(models.Model):
    """A user-defined department, used as a dropdown option on purchases.

    Managed via the Admin Center so the owner can add/remove the options that
    appear in the department dropdowns on purchase orders and line items.
    """

    class Meta:
        """Meta options for the Department model."""

        verbose_name = _('Department')
        verbose_name_plural = _('Departments')
        ordering = ['name']

    @staticmethod
    def get_api_url():
        """Return the API URL associated with the Department model."""
        return reverse('api-department-list')

    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name=_('Name'),
        help_text=_('Department name (e.g. Mechanical Lab)'),
    )

    description = models.CharField(
        max_length=250,
        blank=True,
        default='',
        verbose_name=_('Description'),
        help_text=_('Optional description'),
    )

    active = models.BooleanField(
        default=True,
        verbose_name=_('Active'),
        help_text=_('Only active departments appear in dropdowns'),
    )

    def __str__(self):
        """String representation of a department."""
        return self.name


class PurchaseRecord(models.Model):
    """A single logged purchase, for budgeting and trend analysis."""

    class Meta:
        """Meta options for the PurchaseRecord model."""

        verbose_name = _('Purchase Record')
        verbose_name_plural = _('Purchase Records')

    class BudgetType(models.TextChoices):
        """Whether a purchase is a recurring consumable or one-time capital."""

        RECURRING = 'recurring', _('Recurring')
        CAPITAL = 'capital', _('Capital')

    date = models.DateField(verbose_name=_('Date'), help_text=_('Date of purchase'))

    item = models.CharField(
        max_length=250, verbose_name=_('Item'), help_text=_('Item purchased')
    )

    department = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name=_('Department'),
        help_text=_('Department or purpose (e.g. Mechanical Lab)'),
    )

    budget_type = models.CharField(
        max_length=20,
        choices=BudgetType.choices,
        default=BudgetType.RECURRING,
        verbose_name=_('Budget Type'),
        help_text=_('Recurring consumable or one-time capital'),
    )

    supplier = models.CharField(
        max_length=150,
        blank=True,
        default='',
        verbose_name=_('Supplier'),
        help_text=_('Vendor or source'),
    )

    quantity = models.DecimalField(
        max_digits=15,
        decimal_places=3,
        null=True,
        blank=True,
        verbose_name=_('Quantity'),
    )

    unit_cost = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name=_('Unit Cost'),
        help_text=_('Unit cost in the record currency'),
    )

    total_cost = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        verbose_name=_('Total Cost'),
        help_text=_('Total cost in the record currency'),
    )

    currency = models.CharField(
        max_length=10, default='PKR', verbose_name=_('Currency')
    )

    total_cost_base = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        verbose_name=_('Total Cost (Base)'),
        help_text=_('Total cost converted to the base currency, for reporting'),
    )

    purchase_order = models.ForeignKey(
        'order.PurchaseOrder',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='budget_records',
        verbose_name=_('Purchase Order'),
        help_text=_('Linked purchase order (optional)'),
    )

    source = models.CharField(
        max_length=20,
        default='manual',
        verbose_name=_('Source'),
        help_text=_('How this record was created (historical / manual)'),
    )

    notes = models.CharField(
        max_length=500, blank=True, default='', verbose_name=_('Notes')
    )

    def save(self, *args, **kwargs):
        """Set the base-currency total (converted from the record currency)."""
        if not self.total_cost_base:
            self.total_cost_base = self._convert_to_base()
        super().save(*args, **kwargs)

    def _convert_to_base(self):
        """Convert total_cost (in the record currency) to the base currency."""
        total = self.total_cost or 0

        from common.currency import currency_code_default

        base = currency_code_default()

        if not total or not self.currency or self.currency == base:
            return total

        try:
            from djmoney.contrib.exchange.models import convert_money
            from djmoney.money import Money

            return convert_money(Money(total, self.currency), base).amount
        except Exception:
            # If conversion is unavailable, fall back to the record total
            return total

    def __str__(self):
        """String representation of a purchase record."""
        return f'{self.date} - {self.item}'
