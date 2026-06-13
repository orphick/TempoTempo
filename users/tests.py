from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase


User = get_user_model()


class AuthApiTests(APITestCase):
    def test_user_can_register_and_login_with_email(self):
        register_response = self.client.post('/api/auth/register/', {
            'username': 'mohammad',
            'email': 'mohammad@example.com',
            'password': 'strong-pass-123',
            'phone': '09120000000',
        })

        self.assertEqual(register_response.status_code, 201)
        self.assertTrue(User.objects.filter(email='mohammad@example.com').exists())

        login_response = self.client.post('/api/auth/login/', {
            'email': 'mohammad@example.com',
            'password': 'strong-pass-123',
        })

        self.assertEqual(login_response.status_code, 200)
        self.assertIn('access', login_response.data)
        self.assertIn('refresh', login_response.data)

    def test_authenticated_user_can_read_profile(self):
        user = User.objects.create_user(
            username='customer',
            email='customer@example.com',
            password='strong-pass-123',
        )
        self.client.force_authenticate(user=user)

        response = self.client.get('/api/auth/me/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['email'], 'customer@example.com')
        self.assertIn('is_staff', response.data)
