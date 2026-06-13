from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from blog.models import BlogPost
from orders.models import Coupon
from products.models import Category, Product, ProductVariant


class Command(BaseCommand):
    help = 'Create demo data for local presentations.'

    def handle(self, *args, **options):
        User = get_user_model()

        admin, created = User.objects.get_or_create(
            email='admin@tempotempo.test',
            defaults={
                'username': 'admin',
                'is_staff': True,
                'is_superuser': True,
            },
        )
        if created:
            admin.set_password('admin12345')
            admin.save()

        categories = {
            'steam': Category.objects.get_or_create(
                slug='steam',
                defaults={'name': 'Steam', 'description': 'Steam wallet and game products'},
            )[0],
            'gift-cards': Category.objects.get_or_create(
                slug='gift-cards',
                defaults={'name': 'Gift Cards', 'description': 'Digital gift cards'},
            )[0],
            'world-of-warcraft': Category.objects.get_or_create(
                slug='world-of-warcraft',
                defaults={'name': 'World of Warcraft', 'description': 'Game time and digital services'},
            )[0],
        }

        demo_products = [
            {
                'category': categories['steam'],
                'name': 'Steam Wallet',
                'slug': 'steam-wallet',
                'platform': 'Steam',
                'region': 'Global',
                'delivery_type': 'Instant digital code',
                'short_description': 'Recharge your Steam account instantly.',
                'variants': [('10 USD', '10.00', 20), ('25 USD', '25.00', 12), ('50 USD', '50.00', 7)],
                'is_featured': True,
            },
            {
                'category': categories['gift-cards'],
                'name': 'PlayStation Gift Card',
                'slug': 'playstation-gift-card',
                'platform': 'PlayStation',
                'region': 'US',
                'delivery_type': 'Instant digital code',
                'short_description': 'Top up your PlayStation account.',
                'variants': [('10 USD', '10.00', 15), ('20 USD', '20.00', 10)],
                'is_featured': True,
            },
            {
                'category': categories['world-of-warcraft'],
                'name': 'World of Warcraft Game Time',
                'slug': 'wow-game-time',
                'platform': 'Battle.net',
                'region': 'Global',
                'delivery_type': 'Digital activation',
                'short_description': 'Add game time to your World of Warcraft account.',
                'variants': [('30 Days', '14.99', 8), ('60 Days', '29.99', 5)],
                'is_featured': False,
            },
        ]

        for product_data in demo_products:
            variants = product_data.pop('variants')
            product, _ = Product.objects.update_or_create(
                slug=product_data['slug'],
                defaults=product_data,
            )
            for name, price, stock in variants:
                ProductVariant.objects.update_or_create(
                    product=product,
                    name=name,
                    defaults={
                        'price': Decimal(price),
                        'stock': stock,
                        'is_active': True,
                    },
                )

        Coupon.objects.update_or_create(
            code='DEMO10',
            defaults={
                'discount_type': 'percentage',
                'discount_value': Decimal('10.00'),
                'min_order_amount': Decimal('10.00'),
                'max_uses': 100,
                'is_active': True,
            },
        )

        BlogPost.objects.update_or_create(
            slug='how-to-buy-digital-game-codes',
            defaults={
                'title': 'How to Buy Digital Game Codes Safely',
                'excerpt': 'A short guide for choosing the right region and platform.',
                'content': '<p>Always check the platform, region, and delivery type before checkout.</p>',
                'published': True,
            },
        )

        self.stdout.write(self.style.SUCCESS('Demo data created. Admin login: admin@tempotempo.test / admin12345'))
