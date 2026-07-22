from django.test import TestCase
from rest_framework.test import APIClient
from django.urls import reverse

from .models import User


class LoginViewJWTTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            name='Test User',
            email='test@example.com',
            password='StrongPass123!'
        )

    def test_login_returns_access_and_refresh_tokens_for_valid_credentials(self):
        response = self.client.post(
            reverse('login'),
            {'email': 'test@example.com', 'password': 'StrongPass123!'},
            format='json'
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['name'], self.user.name)
        self.assertEqual(response.data['user']['email'], self.user.email)

    def test_refresh_token_returns_new_access_token(self):
        login_response = self.client.post(
            reverse('login'),
            {'email': 'test@example.com', 'password': 'StrongPass123!'},
            format='json'
        )

        response = self.client.post(
            reverse('token-refresh'),
            {'refresh': login_response.data['refresh']},
            format='json'
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)


class SignupViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_signup_returns_serialized_user_in_response(self):
        response = self.client.post(
            reverse('user-list'),
            {
                'name': 'New User',
                'email': 'new@example.com',
                'password': 'StrongPass123!'
            },
            format='json'
        )

        self.assertEqual(response.status_code, 201)
        self.assertIn('name', response.data)
        self.assertEqual(response.data['name'], 'New User')
        self.assertEqual(response.data['email'], 'new@example.com')


class CurrentUserViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            name='Current User',
            email='current@example.com',
            password='StrongPass123!',
            status='online',
        )

    def test_current_user_returns_authenticated_user_info(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(reverse('current-user'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['name'], self.user.name)
        self.assertEqual(response.data['email'], self.user.email)
        self.assertEqual(response.data['status'], 'online')

    def test_current_user_can_update_profile_details(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(
            reverse('user-detail', kwargs={'pk': self.user.pk}),
            {
                'name': 'Updated Current User',
                'email': 'updated@example.com',
                'status': 'away',
            },
            format='json'
        )

        self.user.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['name'], 'Updated Current User')
        self.assertEqual(response.data['email'], 'updated@example.com')
        self.assertEqual(response.data['status'], 'away')
        self.assertEqual(self.user.name, 'Updated Current User')
        self.assertEqual(self.user.email, 'updated@example.com')
        self.assertEqual(self.user.status, 'away')


class UserSearchViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.current_user = User.objects.create_user(
            name='Current User',
            email='current@example.com',
            password='StrongPass123!',
        )
        self.matching_user = User.objects.create_user(
            name='Sarah Johnson',
            email='sarah@example.com',
            password='StrongPass123!',
        )
        User.objects.create_user(
            name='Mike Chen',
            email='mike@example.com',
            password='StrongPass123!',
        )

    def test_user_search_requires_authentication(self):
        response = self.client.get(reverse('user-list'), {'search': 'Sarah'})

        self.assertEqual(response.status_code, 401)

    def test_user_search_returns_matching_users_and_excludes_current_user(self):
        self.client.force_authenticate(user=self.current_user)

        response = self.client.get(reverse('user-list'), {'search': 'Sarah'})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Sarah Johnson')
        self.assertEqual(response.data[0]['email'], 'sarah@example.com')

    def test_user_search_matches_email(self):
        self.client.force_authenticate(user=self.current_user)

        response = self.client.get(reverse('user-list'), {'search': 'mike@'})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Mike Chen')
