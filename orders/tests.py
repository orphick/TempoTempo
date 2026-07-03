from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from products.models import Category, Product, ProductVariant
from .models import Cart, Coupon, Order, OrderItem, Review


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
            price=Decimal('10.00'),
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
        self.assertEqual(order.total_price, Decimal('18.00'))
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
        self.assertIn('Only 1 units', response.data['error'])

    def test_only_completed_buyers_can_review_product(self):
        forbidden_response = self.client.post(f'/api/reviews/{self.product.id}/', {
            'rating': 5,
            'comment': 'خرید راحت بود و توضیح محصول کمک کرد اشتباه انتخاب نکنم.',
        })

        self.assertEqual(forbidden_response.status_code, 403)

        order = Order.objects.create(
            user=self.user,
            status='completed',
            total_price=Decimal('10.00'),
        )
        OrderItem.objects.create(
            order=order,
            variant=self.variant,
            quantity=1,
            price=Decimal('10.00'),
        )

        response = self.client.post(f'/api/reviews/{self.product.id}/', {
            'rating': 5,
            'comment': 'خرید راحت بود و توضیح محصول کمک کرد اشتباه انتخاب نکنم.',
        })

        self.assertEqual(response.status_code, 201)
        self.assertTrue(Review.objects.filter(user=self.user, product=self.product).exists())
