from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import RequestFactory
from rest_framework.test import APITestCase

from products.models import Category, Product, ProductVariant
from .models import Cart, CartItem, Coupon, Order, OrderItem, Review, OrderStatusAudit
from .admin import OrderAdmin, OrderStatusAuditAdmin


User = get_user_model()


class CommerceFlowTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='buyer',
            email='buyer@example.com',
            password='strong-pass-123',
        )
        self.category = Category.objects.create(name='Gift Cards', slug='gift-cards')
        self.product = Product.objects.create(
            category=self.category,
            name='PlayStation Gift Card',
            slug='ps-gift-card',
            is_active=True,
        )
        self.variant = ProductVariant.objects.create(
            product=self.product,
            name='10 USD',
            price=Decimal('1000000.00'),
            stock=3,
            is_active=True,
        )
        self.client.force_authenticate(user=self.user)

    def test_cart_rejects_invalid_quantity(self):
        response = self.client.post('/api/cart/', {
            'variant_id': self.variant.id,
            'quantity': 0,
        })

        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.data)

    def test_cart_rejects_overstock_without_changing_existing_item(self):
        response = self.client.post('/api/cart/', {'variant_id': self.variant.id, 'quantity': 3})
        self.assertEqual(response.status_code, 200)
        response = self.client.post('/api/cart/', {'variant_id': self.variant.id, 'quantity': 1})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(CartItem.objects.get(cart__user=self.user, variant=self.variant).quantity, 3)

    def test_cart_accepts_exact_stock_and_rejects_new_overstock(self):
        exact = self.client.post('/api/cart/', {'variant_id': self.variant.id, 'quantity': 3})
        self.assertEqual(exact.status_code, 200)
        other = ProductVariant.objects.create(product=self.product, name='test', price=1, stock=2)
        rejected = self.client.post('/api/cart/', {'variant_id': other.id, 'quantity': 3})
        self.assertEqual(rejected.status_code, 400)
        self.assertFalse(CartItem.objects.filter(variant=other).exists())

    def test_checkout_applies_coupon_creates_order_and_reduces_stock(self):
        Coupon.objects.create(
            code='save10',
            discount_type='percentage',
            discount_value=Decimal('10.00'),
        )
        self.client.post('/api/cart/', {
            'variant_id': self.variant.id,
            'quantity': 2,
        })

        response = self.client.post('/api/checkout/', {'coupon_code': 'SAVE10'})

        self.assertEqual(response.status_code, 201)
        order = Order.objects.get(user=self.user)
        self.assertEqual(order.total_price, Decimal('1800000.00'))
        self.assertEqual(order.items.count(), 1)

        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, 1)

        coupon = Coupon.objects.get(code='SAVE10')
        self.assertEqual(coupon.used_count, 1)

        cart = Cart.objects.get(user=self.user)
        self.assertFalse(cart.items.exists())

    def test_checkout_rejects_quantity_above_stock(self):
        self.client.post('/api/cart/', {
            'variant_id': self.variant.id,
            'quantity': 3,
        })
        self.variant.stock = 1
        self.variant.save(update_fields=['stock'])

        response = self.client.post('/api/checkout/')

        self.assertEqual(response.status_code, 400)
        self.assertIn('فقط 1 عدد', response.data['error'])

    def test_only_completed_buyers_can_review_product(self):
        forbidden_response = self.client.post(f'/api/reviews/{self.product.id}/', {
            'rating': 5,
            'comment': 'خرید راحت بود و توضیح محصول کمک کرد اشتباه انتخاب نکنم.',
        })

        self.assertEqual(forbidden_response.status_code, 403)

        order = Order.objects.create(
            user=self.user,
            status='completed',
            total_price=Decimal('1000000.00'),
        )
        OrderItem.objects.create(
            order=order,
            variant=self.variant,
            quantity=1,
            price=Decimal('1000000.00'),
        )

        response = self.client.post(f'/api/reviews/{self.product.id}/', {
            'rating': 5,
            'comment': 'خرید راحت بود و توضیح محصول کمک کرد اشتباه انتخاب نکنم.',
        })

        self.assertEqual(response.status_code, 201)
        self.assertTrue(Review.objects.filter(user=self.user, product=self.product).exists())

    def test_review_rejects_non_numeric_rating(self):
        order = Order.objects.create(
            user=self.user,
            status='completed',
            total_price=Decimal('1000000.00'),
        )
        OrderItem.objects.create(
            order=order,
            variant=self.variant,
            quantity=1,
            price=Decimal('1000000.00'),
        )

        response = self.client.post(f'/api/reviews/{self.product.id}/', {
            'rating': 'excellent',
            'comment': 'تست ورودی نامعتبر برای امتیاز.',
        })

        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.data)
        self.assertFalse(Review.objects.filter(user=self.user, product=self.product).exists())


class OrderTransitionTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='buyer2', email='buyer2@example.com', password='not-common-Pass-482!')
        self.staff = User.objects.create_user(username='staff', email='staff@example.com', password='not-common-Pass-482!', is_staff=True)
        category = Category.objects.create(name='cards', slug='cards')
        product = Product.objects.create(category=category, name='Card', slug='card')
        self.variant = ProductVariant.objects.create(product=product, name='one', price=10, stock=0)
        self.order = Order.objects.create(user=self.user, status='pending', total_price=10)
        OrderItem.objects.create(order=self.order, variant=self.variant, quantity=2, price=10)
        self.client.force_authenticate(self.staff)

    def test_transition_matrix_and_audit(self):
        response = self.client.patch(f'/api/admin/orders/{self.order.id}/', {'status': 'completed'})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.client.patch(f'/api/admin/orders/{self.order.id}/', {'status': 'processing'}).status_code, 200)
        self.assertEqual(self.client.patch(f'/api/admin/orders/{self.order.id}/', {'status': 'completed'}).status_code, 200)
        self.assertEqual(self.client.patch(f'/api/admin/orders/{self.order.id}/', {'status': 'pending'}).status_code, 400)
        self.assertEqual(OrderStatusAudit.objects.filter(order=self.order).count(), 2)

    def test_cancellation_restores_inventory_once(self):
        response = self.client.patch(f'/api/admin/orders/{self.order.id}/', {'status': 'cancelled'})
        self.assertEqual(response.status_code, 200)
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, 2)
        response = self.client.patch(f'/api/admin/orders/{self.order.id}/', {'status': 'cancelled'})
        self.assertEqual(response.status_code, 400)
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, 2)

    def test_nonstaff_and_other_user_cannot_access_protected_resources(self):
        other = User.objects.create_user(username='other', email='other@example.com', password='not-common-Pass-482!')
        other_cart = Cart.objects.create(user=other)
        other_item = CartItem.objects.create(cart=other_cart, variant=self.variant, quantity=1)
        other_order = Order.objects.create(user=other, status='pending', total_price=10)
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.get('/api/admin/stats/').status_code, 403)
        self.assertEqual(self.client.patch(f'/api/admin/orders/{self.order.id}/', {'status': 'cancelled'}).status_code, 403)
        self.assertEqual(self.client.patch(f'/api/cart/{other_item.id}/', {'quantity': 2}).status_code, 404)
        self.assertEqual(self.client.delete(f'/api/cart/{other_item.id}/').status_code, 404)
        self.assertEqual(self.client.get('/api/orders/').status_code, 200)
        self.assertNotIn(other_order.id, [order['id'] for order in self.client.get('/api/orders/').data])
        self.client.force_authenticate(user=None)
        self.assertEqual(self.client.get('/api/cart/').status_code, 401)

    def test_admin_locks_direct_order_and_audit_mutations(self):
        site = __import__('django.contrib.admin', fromlist=['site']).site
        request = RequestFactory().get('/admin/')
        request.user = self.staff
        order_admin = OrderAdmin(Order, site)
        audit_admin = OrderStatusAuditAdmin(OrderStatusAudit, site)
        self.assertTrue('status' in order_admin.get_readonly_fields(request, self.order))
        self.assertFalse(order_admin.has_delete_permission(request, self.order))
        self.assertFalse(audit_admin.has_add_permission(request))
        self.assertFalse(audit_admin.has_change_permission(request))
        self.assertFalse(audit_admin.has_delete_permission(request))
