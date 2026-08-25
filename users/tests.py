from django.contrib.auth import get_user_model
from django.test import Client
from rest_framework.test import APITestCase


User = get_user_model()


class AuthApiTests(APITestCase):
    def test_user_can_register_and_login_with_email(self):
        register_response = self.client.post('/api/auth/register/', {
            'username': 'mohammad',
            'email': 'mohammad@example.com',
            'password': 'not-common-Pass-482!',
            'phone': '09120000000',
        })

        self.assertEqual(register_response.status_code, 201)
        self.assertTrue(User.objects.filter(email='mohammad@example.com').exists())

        login_response = self.client.post('/api/auth/login/', {
            'email': 'mohammad@example.com',
            'password': 'not-common-Pass-482!',
        })

        self.assertEqual(login_response.status_code, 200)
        self.assertIn('access', login_response.data)
        self.assertNotIn('refresh', login_response.data)
        self.assertIn('tempotempo_refresh', login_response.cookies)

    def test_authenticated_user_can_read_profile(self):
        user = User.objects.create_user(
            username='customer',
            email='customer@example.com',
            password='not-common-Pass-482!',
        )
        self.client.force_authenticate(user=user)

        response = self.client.get('/api/auth/me/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['email'], 'customer@example.com')
        self.assertIn('is_staff', response.data)

    def test_password_change_has_field_errors_and_applies_validators(self):
        user = User.objects.create_user(username='alice', email='alice@example.com', password='not-common-Pass-482!')
        self.client.force_authenticate(user=user)
        self.assertEqual(self.client.post('/api/auth/change-password/', {}).status_code, 400)
        weak = self.client.post('/api/auth/change-password/', {'old_password': 'not-common-Pass-482!', 'new_password': '12345678'})
        self.assertEqual(weak.status_code, 400)
        wrong = self.client.post('/api/auth/change-password/', {'old_password': 'wrong', 'new_password': 'not-common-Pass-483!'})
        self.assertEqual(wrong.status_code, 400)
        success = self.client.post('/api/auth/change-password/', {'old_password': 'not-common-Pass-482!', 'new_password': 'not-common-Pass-483!'})
        self.assertEqual(success.status_code, 200)

    def test_refresh_rotation_and_logout_blacklist(self):
        user = User.objects.create_user(username='bob', email='bob@example.com', password='not-common-Pass-482!')
        login = self.client.post('/api/auth/login/', {'email': user.email, 'password': 'not-common-Pass-482!'})
        original = login.cookies['tempotempo_refresh'].value
        refresh = self.client.post('/api/auth/token/refresh/', HTTP_X_CSRFTOKEN='test')
        # APIClient does not enforce CSRF by default; cookie lifecycle is tested here.
        self.assertEqual(refresh.status_code, 200)
        rotated = refresh.cookies['tempotempo_refresh'].value
        self.assertNotEqual(original, rotated)
        self.client.cookies['tempotempo_refresh'] = original
        self.assertEqual(self.client.post('/api/auth/token/refresh/').status_code, 401)
        self.client.cookies['tempotempo_refresh'] = rotated
        self.assertEqual(self.client.post('/api/auth/logout/').status_code, 204)
        self.client.cookies['tempotempo_refresh'] = rotated
        self.assertEqual(self.client.post('/api/auth/token/refresh/').status_code, 401)

    def test_csrf_is_enforced_for_cookie_authentication_operations(self):
        user = User.objects.create_user(username='csrf', email='csrf@example.com', password='not-common-Pass-482!')
        client = Client(enforce_csrf_checks=True)
        self.assertEqual(client.post('/api/auth/login/', {'email': user.email, 'password': 'not-common-Pass-482!'}).status_code, 403)
        csrf = client.get('/api/auth/csrf/')
        self.assertEqual(csrf.status_code, 200)
        token = csrf.cookies['csrftoken'].value
        login = client.post('/api/auth/login/', {'email': user.email, 'password': 'not-common-Pass-482!'}, HTTP_X_CSRFTOKEN=token)
        self.assertEqual(login.status_code, 200)
        self.assertEqual(client.post('/api/auth/token/refresh/').status_code, 403)
        self.assertEqual(client.post('/api/auth/token/refresh/', HTTP_X_CSRFTOKEN=token).status_code, 200)

    def test_inactive_user_cannot_authenticate(self):
        user = User.objects.create_user(username='inactive', email='inactive@example.com', password='not-common-Pass-482!', is_active=False)
        response = self.client.post('/api/auth/login/', {'email': user.email, 'password': 'not-common-Pass-482!'})
        self.assertIn(response.status_code, (401, 403))
        self.assertNotIn('access', response.data)
