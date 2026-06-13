from decimal import Decimal

from django.db import models as db_models, transaction
from django.db.models.functions import TruncMonth
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from products.models import Product as ProductModel, ProductVariant
from products.serializers import ProductListSerializer
from .serializers import CartSerializer, OrderSerializer
from .models import Cart, CartItem, Order, OrderItem, Wishlist, Review, Coupon


def parse_positive_int(value, field_name):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return None, f'{field_name} must be a positive number'
    if parsed < 1:
        return None, f'{field_name} must be at least 1'
    return parsed, None


class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return Response(CartSerializer(cart).data)

    def post(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        variant_id = request.data.get('variant_id')
        quantity, error = parse_positive_int(request.data.get('quantity', 1), 'quantity')
        if error:
            return Response({'error': error}, status=400)

        try:
            variant = ProductVariant.objects.get(id=variant_id, is_active=True)
        except ProductVariant.DoesNotExist:
            return Response({'error': 'Variant not found'}, status=404)

        if variant.stock < 1:
            return Response({'error': 'Product is out of stock'}, status=400)

        item, created = CartItem.objects.get_or_create(cart=cart, variant=variant)
        if not created:
            item.quantity = min(item.quantity + quantity, variant.stock)
        else:
            item.quantity = min(quantity, variant.stock)
        item.save()
        return Response(CartSerializer(cart).data)


class CartItemView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, item_id):
        try:
            item = CartItem.objects.get(id=item_id, cart__user=request.user)
        except CartItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=404)
        quantity, error = parse_positive_int(request.data.get('quantity', item.quantity), 'quantity')
        if error:
            return Response({'error': error}, status=400)
        if quantity > item.variant.stock:
            return Response({'error': 'Requested quantity exceeds stock'}, status=400)
        item.quantity = quantity
        item.save()
        return Response(CartSerializer(item.cart).data)

    def delete(self, request, item_id):
        try:
            item = CartItem.objects.get(id=item_id, cart__user=request.user)
        except CartItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=404)
        cart = item.cart
        item.delete()
        return Response(CartSerializer(cart).data)


class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        coupon_code = request.data.get('coupon_code', '').strip().upper()

        with transaction.atomic():
            cart, _ = Cart.objects.get_or_create(user=request.user)
            items = list(
                cart.items.select_related('variant', 'variant__product').select_for_update()
            )
            if not items:
                return Response({'error': 'Cart is empty'}, status=400)

            variant_ids = [item.variant_id for item in items]
            variants = {
                variant.id: variant
                for variant in ProductVariant.objects.select_for_update().filter(id__in=variant_ids)
            }

            for item in items:
                variant = variants[item.variant_id]
                if not variant.is_active:
                    return Response({'error': f'{variant.name} is not available'}, status=400)
                if item.quantity > variant.stock:
                    return Response(
                        {'error': f'Only {variant.stock} units of {variant.name} are available'},
                        status=400,
                    )

            total = sum(item.variant.price * item.quantity for item in items)
            discount_amount = Decimal('0.00')
            coupon = None

            if coupon_code:
                try:
                    coupon = Coupon.objects.select_for_update().get(code=coupon_code)
                except Coupon.DoesNotExist:
                    return Response({'error': 'کد تخفیف معتبر نیست'}, status=404)

                valid, message = coupon.is_valid(total)
                if not valid:
                    return Response({'error': message}, status=400)
                discount_amount = Decimal(str(coupon.calculate_discount(total)))

            final_total = max(total - discount_amount, Decimal('0.00'))

            order = Order.objects.create(
                user=request.user,
                total_price=final_total,
                status='pending'
            )

            OrderItem.objects.bulk_create([
                OrderItem(
                    order=order,
                    variant=item.variant,
                    quantity=item.quantity,
                    price=item.variant.price,
                )
                for item in items
            ])

            for item in items:
                variant = variants[item.variant_id]
                variant.stock -= item.quantity
                variant.save(update_fields=['stock'])

            if coupon:
                coupon.used_count += 1
                coupon.save(update_fields=['used_count'])

            cart.items.all().delete()

        return Response(OrderSerializer(order).data, status=201)


class OrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = (
            Order.objects
            .filter(user=request.user)
            .prefetch_related('items__variant')
            .order_by('-created_at')
        )
        return Response(OrderSerializer(orders, many=True).data)


class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        User = get_user_model()
        total_revenue = Order.objects.filter(
            status='completed'
        ).aggregate(total=db_models.Sum('total_price'))['total'] or 0

        orders_by_status = {
            s: Order.objects.filter(status=s).count()
            for s, _ in Order.STATUS_CHOICES
        }

        monthly = (
            Order.objects
            .filter(status='completed')
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(revenue=db_models.Sum('total_price'))
            .order_by('month')
        )

        monthly_revenue = [
            {
                'month': entry['month'].strftime('%Y/%m'),
                'revenue': float(entry['revenue'])
            }
            for entry in monthly
        ]

        return Response({
            'total_revenue': float(total_revenue),
            'total_orders': Order.objects.count(),
            'total_users': User.objects.count(),
            'total_products': ProductModel.objects.filter(is_active=True).count(),
            'orders_by_status': orders_by_status,
            'monthly_revenue': monthly_revenue,
        })


class AdminOrderListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        orders = Order.objects.select_related('user').order_by('-created_at')[:50]
        data = [
            {
                'id': o.id,
                'user_email': o.user.email,
                'status': o.status,
                'total_price': float(o.total_price),
                'created_at': o.created_at.strftime('%Y/%m/%d %H:%M'),
                'items_count': o.items.count(),
            }
            for o in orders
        ]
        return Response(data)

    def patch(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({'error': 'سفارش یافت نشد'}, status=404)
        new_status = request.data.get('status')
        if new_status not in dict(Order.STATUS_CHOICES):
            return Response({'error': 'وضعیت نامعتبر'}, status=400)
        order.status = new_status
        order.save()
        return Response({'success': True, 'status': order.status})


class WishlistView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = Wishlist.objects.filter(user=request.user).select_related('product')
        products = [item.product for item in items]
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        product_id = request.data.get('product_id')
        try:
            product = ProductModel.objects.get(id=product_id)
        except ProductModel.DoesNotExist:
            return Response({'error': 'محصول یافت نشد'}, status=404)
        Wishlist.objects.get_or_create(user=request.user, product=product)
        return Response({'added': True})

    def delete(self, request, product_id):
        Wishlist.objects.filter(user=request.user, product_id=product_id).delete()
        return Response({'removed': True})


class ReviewView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return []

    def get(self, request, product_id):
        reviews = Review.objects.filter(
            product_id=product_id
        ).select_related('user').order_by('-created_at')

        data = [
            {
                'id': r.id,
                'user': r.user.username,
                'rating': r.rating,
                'comment': r.comment,
                'created_at': r.created_at.strftime('%Y/%m/%d'),
            }
            for r in reviews
        ]

        avg = reviews.aggregate(avg=db_models.Avg('rating'))['avg']

        return Response({
            'reviews': data,
            'count': reviews.count(),
            'average': round(avg, 1) if avg else None,
        })

    def post(self, request, product_id):
        try:
            product = ProductModel.objects.get(id=product_id)
        except ProductModel.DoesNotExist:
            return Response({'error': 'محصول یافت نشد'}, status=404)

        has_ordered = Order.objects.filter(
            user=request.user,
            status='completed',
            items__variant__product=product
        ).exists()

        if not has_ordered:
            return Response(
                {'error': 'فقط خریداران این محصول می‌توانند نظر ثبت کنند'},
                status=403
            )

        rating = int(request.data.get('rating', 0))
        if not 1 <= rating <= 5:
            return Response({'error': 'امتیاز باید بین ۱ تا ۵ باشد'}, status=400)

        review, created = Review.objects.get_or_create(
            user=request.user,
            product=product,
            defaults={
                'rating': rating,
                'comment': request.data.get('comment', '')
            }
        )

        if not created:
            review.rating = rating
            review.comment = request.data.get('comment', '')
            review.save()

        return Response({'success': True}, status=201)
    
class CouponValidateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        code = request.data.get('code', '').strip().upper()
        try:
            coupon = Coupon.objects.get(code=code)
        except Coupon.DoesNotExist:
            return Response({'error': 'کد تخفیف معتبر نیست'}, status=404)

        cart, _ = Cart.objects.get_or_create(user=request.user)
        valid, message = coupon.is_valid(cart.total)
        if not valid:
            return Response({'error': message}, status=400)

        discount = coupon.calculate_discount(cart.total)
        new_total = max(cart.total - discount, Decimal('0.00'))
        return Response({
            'valid': True,
            'code': coupon.code,
            'discount_type': coupon.discount_type,
            'discount_value': float(coupon.discount_value),
            'discount_amount': float(discount),
            'new_total': float(new_total),
        })
