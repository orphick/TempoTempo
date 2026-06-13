from django.contrib import admin
from .models import BlogPost


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ['title', 'published', 'created_at']
    list_editable = ['published']
    prepopulated_fields = {'slug': ('title',)}
    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('title', 'slug', 'image', 'excerpt')
        }),
        ('محتوا', {
            'fields': ('content',)
        }),
        ('تنظیمات', {
            'fields': ('published',)
        }),
    )