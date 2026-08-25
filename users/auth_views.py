from django.conf import settings
from django.contrib.auth import get_user_model
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from rest_framework import permissions, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken


REFRESH_COOKIE = 'tempotempo_refresh'


def set_refresh_cookie(response, token):
    response.set_cookie(
        REFRESH_COOKIE, token, httponly=True, secure=not settings.DEBUG,
        samesite='None' if not settings.DEBUG else 'Lax', max_age=int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()),
        path='/api/auth/',
    )


def clear_refresh_cookie(response):
    response.delete_cookie(REFRESH_COOKIE, path='/api/auth/', samesite='None' if not settings.DEBUG else 'Lax')


class CsrfTokenView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({'csrfToken': get_token(request)})


@method_decorator(csrf_protect, name='dispatch')
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_scope = 'login'

    def post(self, request):
        serializer = TokenObtainPairSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        response = Response({'access': str(serializer.validated_data['access'])})
        set_refresh_cookie(response, str(serializer.validated_data['refresh']))
        return response


@method_decorator(csrf_protect, name='dispatch')
class RefreshView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_scope = 'refresh'

    def post(self, request):
        raw_token = request.COOKIES.get(REFRESH_COOKIE)
        if not raw_token:
            raise serializers.ValidationError({'refresh': ['نشست معتبر نیست یا منقضی شده است.']})
        try:
            refresh = RefreshToken(raw_token)
            access = str(refresh.access_token)
            # Rotate and blacklist the submitted token before issuing its replacement.
            refresh.blacklist()
            replacement = RefreshToken.for_user(get_user_model().objects.get(pk=refresh['user_id']))
        except TokenError:
            response = Response({'refresh': ['نشست معتبر نیست یا منقضی شده است.']}, status=401)
            clear_refresh_cookie(response)
            return response
        response = Response({'access': access})
        set_refresh_cookie(response, str(replacement))
        return response


@method_decorator(csrf_protect, name='dispatch')
class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        raw_token = request.COOKIES.get(REFRESH_COOKIE)
        if raw_token:
            try:
                RefreshToken(raw_token).blacklist()
            except TokenError:
                pass
        response = Response(status=204)
        clear_refresh_cookie(response)
        return response
