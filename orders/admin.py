from django.contrib import admin
from django.core.exceptions import ValidationError
from .models import Cart, CartItem, Order, OrderItem, Wishlist, Review, Coupon, OrderStatusAudit
from .services import change_order_status


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['variant', 'quantity', 'price', 'subtotal']
    can_delete = False
    max_num = 0


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['user', 'total', 'updated_at']
    search_fields = ['user__email', 'user__username']
    inlines = [CartItemInline]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'status', 'total_price', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['user__email', 'user__username']
    inlines = [OrderItemInline]
    readonly_fields = ['user', 'status', 'total_price', 'created_at', 'updated_at']
    actions = ['mark_processing', 'mark_completed', 'cancel_orders']

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.action(description='تغییر وضعیت به در حال پردازش')
    def mark_processing(self, request, queryset):
        self._transition(request, queryset, 'processing')

    @admin.action(description='تغییر وضعیت به تکمیل‌شده')
    def mark_completed(self, request, queryset):
        self._transition(request, queryset, 'completed')

    @admin.action(description='لغو سفارش و بازگرداندن موجودی')
    def cancel_orders(self, request, queryset):
        self._transition(request, queryset, 'cancelled')

    def _transition(self, request, queryset, status):
        for order in queryset:
            try:
                change_order_status(order_id=order.pk, new_status=status, acting_admin=request.user)
            except ValidationError as exc:
                self.message_user(request, f'سفارش {order.pk}: {exc.messages[0]}', level='error')

@admin.register(OrderStatusAudit)
class OrderStatusAuditAdmin(admin.ModelAdmin):
    list_display = ['order', 'previous_status', 'new_status', 'acting_admin', 'created_at']
    readonly_fields = ['order', 'previous_status', 'new_status', 'acting_admin', 'created_at']

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ['user', 'product', 'created_at']
    search_fields = ['user__email', 'product__name']

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['user', 'product', 'rating', 'created_at']
    list_filter = ['rating']

@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ['code', 'discount_type', 'discount_value', 'used_count', 'max_uses', 'expiry_date', 'is_active']
    list_editable = ['is_active']
    fields = ['code', 'discount_type', 'discount_value', 'min_order_amount', 'max_uses', 'expiry_date', 'is_active']
