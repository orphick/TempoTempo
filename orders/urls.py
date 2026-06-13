from django.urls import path
from .views import (
    CartView, CartItemView, CheckoutView,
    OrderListView, AdminStatsView, AdminOrderListView,
    WishlistView, ReviewView, CouponValidateView
)

urlpatterns = [
    path('cart/', CartView.as_view()),
    path('cart/<int:item_id>/', CartItemView.as_view()),
    path('checkout/', CheckoutView.as_view()),
    path('orders/', OrderListView.as_view()),
    path('admin/stats/', AdminStatsView.as_view()),
    path('admin/orders/', AdminOrderListView.as_view()),
    path('admin/orders/<int:order_id>/', AdminOrderListView.as_view()),
    path('wishlist/', WishlistView.as_view()),
    path('wishlist/<int:product_id>/', WishlistView.as_view()),
    path('reviews/<int:product_id>/', ReviewView.as_view()),
    path('coupon/validate/', CouponValidateView.as_view()),
]