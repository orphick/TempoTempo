from django.contrib import admin
from .models import Category, Product, ProductVariant


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'platform', 'region', 'is_active', 'is_featured']
    list_filter = ['category', 'is_active', 'is_featured', 'platform', 'region']
    search_fields = ['name', 'slug', 'description']
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductVariantInline]
    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('name', 'slug', 'category', 'image')
        }),
        ('توضیحات', {
            'fields': ('short_description', 'description')
        }),
        ('مشخصات محصول', {
            'fields': ('platform', 'region', 'delivery_type')
        }),
        ('تنظیمات', {
            'fields': ('is_active', 'is_featured')
        }),
    )

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ['product', 'name', 'price', 'stock', 'is_active']
