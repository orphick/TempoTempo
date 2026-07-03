from decimal import Decimal

from rest_framework.test import APITestCase

from .models import Category, Product, ProductVariant


class ProductApiTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Steam', slug='steam')
        self.product = Product.objects.create(
            category=self.category,
            name='Steam Wallet',
            slug='steam-wallet',
            is_active=True,
        )
        ProductVariant.objects.create(
            product=self.product,
            name='10 USD',
            price=Decimal('1000000.00'),
            stock=5,
            is_active=True,
        )
        Product.objects.create(
            category=self.category,
            name='Hidden Product',
            slug='hidden-product',
            is_active=False,
        )

    def test_product_list_returns_active_products_with_starting_price(self):
        response = self.client.get('/api/products/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['slug'], 'steam-wallet')
        self.assertEqual(Decimal(response.data['results'][0]['starting_price']), Decimal('1000000.00'))

    def test_product_list_can_filter_by_category_and_search(self):
        response = self.client.get('/api/products/?category=steam&search=wallet')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['category_name'], 'Steam')
