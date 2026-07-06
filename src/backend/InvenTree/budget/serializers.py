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
            'source',
            'notes',
        ]
