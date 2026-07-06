"""API endpoints for the budget app."""

from django.urls import include, path

from rest_framework import permissions

from budget.models import PurchaseRecord
from budget.serializers import PurchaseRecordSerializer
from InvenTree.filters import SEARCH_ORDER_FILTER
from InvenTree.mixins import ListCreateAPI, RetrieveUpdateDestroyAPI


class PurchaseRecordMixin:
    """Shared configuration for purchase-record endpoints."""

    queryset = PurchaseRecord.objects.all()
    serializer_class = PurchaseRecordSerializer
    permission_classes = [permissions.IsAuthenticated]


class PurchaseRecordList(PurchaseRecordMixin, ListCreateAPI):
    """List and create purchase records."""

    filter_backends = SEARCH_ORDER_FILTER
    filterset_fields = ['budget_type', 'department', 'supplier', 'source']
    ordering_fields = [
        'date',
        'item',
        'total_cost_base',
        'department',
        'budget_type',
        'supplier',
    ]
    ordering = '-date'
    search_fields = ['item', 'department', 'supplier', 'notes']


class PurchaseRecordDetail(PurchaseRecordMixin, RetrieveUpdateDestroyAPI):
    """Retrieve, update or delete a single purchase record."""


budget_api_urls = [
    path(
        'record/',
        include([
            path(
                '<int:pk>/',
                PurchaseRecordDetail.as_view(),
                name='api-purchase-record-detail',
            ),
            path('', PurchaseRecordList.as_view(), name='api-purchase-record-list'),
        ]),
    )
]
