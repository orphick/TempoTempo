from django.urls import path
from .views import CategoryListView, ProductListView, ProductDetailView

urlpatterns = [
    path('categories/', CategoryListView.as_view()),
    path('', ProductListView.as_view()),
    path('<slug:slug>/', ProductDetailView.as_view()),
]