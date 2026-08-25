from django.urls import path
from .views import RegisterView, MeView, ChangePasswordView
from .auth_views import CsrfTokenView, LoginView, RefreshView, LogoutView

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('csrf/', CsrfTokenView.as_view()),
    path('login/', LoginView.as_view()),
    path('token/refresh/', RefreshView.as_view()),
    path('logout/', LogoutView.as_view()),
    path('me/', MeView.as_view()),
    path('change-password/', ChangePasswordView.as_view()),
]
