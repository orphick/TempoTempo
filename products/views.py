from rest_framework import generics
from rest_framework.pagination import PageNumberPagination
from django.db.models import Min, Q
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer, ProductListSerializer


class ProductPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 48


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    queryset = Product.objects.none()
    pagination_class = ProductPagination

    def get_queryset(self):
        queryset = (
            Product.objects
            .filter(is_active=True)
            .select_related('category')
            .prefetch_related('variants')
            .annotate(starting_price_value=Min('variants__price', filter=Q(variants__is_active=True)))
            .order_by('-created_at')
        )
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__slug__iexact=category)
        featured = self.request.query_params.get('featured')
        if featured == 'true':
            queryset = queryset.filter(is_featured=True)
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset


class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.filter(is_active=True).select_related('category').prefetch_related('variants')
    serializer_class = ProductSerializer
    lookup_field = 'slug'
