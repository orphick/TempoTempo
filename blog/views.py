from rest_framework import generics
from .models import BlogPost
from .serializers import BlogPostListSerializer, BlogPostDetailSerializer


class BlogPostListView(generics.ListAPIView):
    queryset = BlogPost.objects.filter(published=True)
    serializer_class = BlogPostListSerializer


class BlogPostDetailView(generics.RetrieveAPIView):
    queryset = BlogPost.objects.filter(published=True)
    serializer_class = BlogPostDetailSerializer
    lookup_field = 'slug'