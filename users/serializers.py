from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'phone']

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

    def validate_password(self, value):
        candidate = User(username=self.initial_data.get('username', ''), email=self.initial_data.get('email', ''))
        validate_password(value, candidate)
        return value


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, allow_blank=False, trim_whitespace=False)
    new_password = serializers.CharField(required=True, allow_blank=False, trim_whitespace=False)

    def validate_old_password(self, value):
        if not self.context['request'].user.check_password(value):
            raise serializers.ValidationError('رمز عبور فعلی اشتباه است.')
        return value

    def validate_new_password(self, value):
        validate_password(value, self.context['request'].user)
        return value


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone', 'avatar', 'is_staff', 'created_at']
        read_only_fields = ['id', 'is_staff', 'created_at']
