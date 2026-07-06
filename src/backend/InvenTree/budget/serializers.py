"""Serializers for the budget app."""

from rest_framework import serializers

from budget.models import Department, PurchaseRecord


class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer for a Department."""

    class Meta:
        """Meta options for the serializer."""

        model = Department
        fields = ['pk', 'name', 'description', 'active']


class PurchaseRecordSerializer(serializers.ModelSerializer):
    """Serializer for a PurchaseRecord."""

    class Meta:
        """Meta options for the serializer."""

        model = PurchaseRecord
        fields = [
            'pk',
            'date',
            'item',
            'department',
            'budget_type',
            'supplier',
            'quantity',
            'unit_cost',
            'total_cost',
            'currency',
            'total_cost_base',
            'purchase_order',
            'purchase_order_reference',
            'source',
            'notes',
        ]

    purchase_order_reference = serializers.SerializerMethodField()

    def get_purchase_order_reference(self, obj):
        """Return the linked purchase order's reference (or None)."""
        return obj.purchase_order.reference if obj.purchase_order else None
