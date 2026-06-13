from django.db import models


class BlogPost(models.Model):
    title = models.CharField(max_length=200, verbose_name='عنوان')
    slug = models.SlugField(unique=True, verbose_name='اسلاگ')
    excerpt = models.CharField(max_length=300, blank=True, verbose_name='خلاصه')
    content = models.TextField(verbose_name='محتوا')
    image = models.ImageField(upload_to='blog/', blank=True, null=True, verbose_name='تصویر')
    published = models.BooleanField(default=False, verbose_name='منتشر شده')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'مقاله'
        verbose_name_plural = 'مقالات'

    def __str__(self):
        return self.title
