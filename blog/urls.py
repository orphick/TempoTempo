from django.urls import path
from .views import BlogPostListView, BlogPostDetailView

urlpatterns = [
    path('', BlogPostListView.as_view()),
    path('<slug:slug>/', BlogPostDetailView.as_view()),
]