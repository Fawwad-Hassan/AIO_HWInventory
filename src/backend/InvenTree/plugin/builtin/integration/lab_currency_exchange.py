"""Custom currency exchange plugin that supports a PKR (and other) base currency.

The default InvenTree provider (frankfurter.app) only covers a limited set of
major currencies and does not support PKR as a base. This plugin fetches rates
from open.er-api.com, which supports PKR (and needs no API key).
"""

from django.utils.translation import gettext_lazy as _

import structlog

from plugin import InvenTreePlugin
from plugin.mixins import APICallMixin, CurrencyExchangeMixin

logger = structlog.get_logger('inventree')


class LabCurrencyExchange(APICallMixin, CurrencyExchangeMixin, InvenTreePlugin):
    """Currency exchange plugin using open.er-api.com (supports a PKR base)."""

    NAME = 'LabCurrencyExchange'
    SLUG = 'lab-currency-exchange'
    AUTHOR = _('InvenTree contributors')
    TITLE = _('Lab Currency Exchange')
    DESCRIPTION = _('Currency exchange rates that support a PKR base currency')
    VERSION = '1.0.0'

    @property
    def api_url(self):
        """Return the base API URL for this plugin."""
        return 'https://open.er-api.com'

    def update_exchange_rates(self, base_currency: str, symbols: list[str]) -> dict:
        """Fetch exchange rates for the given base currency."""
        response = self.api_call(f'v6/latest/{base_currency}', simple_response=False)

        if response.status_code != 200:
            logger.warning(
                'Failed to update exchange rates from %s: status %s',
                self.api_url,
                response.status_code,
            )
            return {}

        data = response.json()
        all_rates = data.get('rates', {})

        rates = {base_currency: 1.00}
        for symbol in symbols:
            if symbol in all_rates:
                rates[symbol] = all_rates[symbol]

        return rates
