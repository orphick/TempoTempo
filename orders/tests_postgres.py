"""Real-database contention checks. These are deliberately skipped outside PostgreSQL."""
from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal
from threading import Barrier

from django.contrib.auth import get_user_model
from django.db import connection, connections
from django.test import TransactionTestCase, skipUnlessDBFeature
from rest_framework.test import APIClient

from products.models import Category, Product, ProductVariant
from .models import Coupon


@skipUnlessDBFeature('has_select_for_update')
class PostgreSQLCheckoutConcurrencyTests(TransactionTestCase):
    """Run with DATABASE_URL pointing at an isolated PostgreSQL database, never SQLite."""
    reset_sequences = True

    def setUp(self):
        user_model = get_user_model()
        self.first = user_model.objects.create_user(username='first', email='first@pg.test', password='not-common-Pass-482!')
        self.second = user_model.objects.create_user(username='second', email='second@pg.test', password='not-common-Pass-482!')
        category = Category.objects.create(name='pg', slug='pg')
        product = Product.objects.create(category=category, name='Only one', slug='only-one')
        self.variant = ProductVariant.objects.create(product=product, name='only', price=Decimal('10'), stock=1)

    def checkout(self, user, coupon_code=''):
        try:
            client = APIClient()
            client.force_authenticate(user=user)
            client.post('/api/cart/', {'variant_id': self.variant.id, 'quantity': 1}, format='json')
            self.barrier.wait(timeout=10)
            return client.post('/api/checkout/', {'coupon_code': coupon_code}, format='json').status_code
        finally:
            connections.close_all()

    def test_only_one_buyer_can_purchase_the_final_unit(self):
        self.barrier = Barrier(2)
        with ThreadPoolExecutor(max_workers=2) as pool:
            statuses = list(pool.map(self.checkout, [self.first, self.second]))
        self.assertEqual(sorted(statuses), [201, 400])
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, 0)

    def test_coupon_max_uses_is_not_exceeded_under_contention(self):
        self.variant.stock = 2
        self.variant.save(update_fields=['stock'])
        Coupon.objects.create(code='ONEUSE', discount_type='fixed', discount_value=Decimal('1'), max_uses=1)
        self.barrier = Barrier(2)
        with ThreadPoolExecutor(max_workers=2) as pool:
            statuses = list(pool.map(lambda user: self.checkout(user, 'ONEUSE'), [self.first, self.second]))
        self.assertEqual(sorted(statuses), [201, 400])
        coupon = Coupon.objects.get(code='ONEUSE')
        self.assertEqual(coupon.used_count, 1)
