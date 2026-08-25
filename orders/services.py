from django.core.exceptions import ValidationError
from django.db import transaction

from products.models import ProductVariant
from .models import Order, OrderStatusAudit


ALLOWED_ORDER_TRANSITIONS = {
    'pending': {'processing', 'cancelled'},
    'processing': {'completed', 'cancelled'},
    'completed': set(),
    'cancelled': set(),
}


def change_order_status(*, order_id, new_status, acting_admin):
    """The sole status-transition path for APIs and Django Admin."""
    if new_status not in dict(Order.STATUS_CHOICES):
        raise ValidationError('وضعیت نامعتبر است.')
    with transaction.atomic():
        order = Order.objects.select_for_update().get(pk=order_id)
        if new_status not in ALLOWED_ORDER_TRANSITIONS[order.status]:
            raise ValidationError('تغییر وضعیت درخواستی مجاز نیست.')
        previous_status = order.status
        if new_status == 'cancelled':
            items = list(order.items.select_for_update())
            variants = {
                variant.pk: variant
                for variant in ProductVariant.objects.select_for_update().filter(
                    pk__in=[item.variant_id for item in items]
                )
            }
            for item in items:
                variant = variants[item.variant_id]
                variant.stock += item.quantity
                variant.save(update_fields=['stock'])
        order.status = new_status
        order.save(update_fields=['status', 'updated_at'])
        OrderStatusAudit.objects.create(
            order=order, previous_status=previous_status,
            new_status=new_status, acting_admin=acting_admin,
        )
        return order
