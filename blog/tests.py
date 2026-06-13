from rest_framework.test import APITestCase

from .models import BlogPost


class BlogApiTests(APITestCase):
    def test_only_published_posts_are_listed(self):
        BlogPost.objects.create(
            title='Published',
            slug='published',
            excerpt='Visible post',
            content='Body',
            published=True,
        )
        BlogPost.objects.create(
            title='Draft',
            slug='draft',
            excerpt='Hidden post',
            content='Body',
            published=False,
        )

        response = self.client.get('/api/blog/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['slug'], 'published')
