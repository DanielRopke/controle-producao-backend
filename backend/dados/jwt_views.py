from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class ActiveUserTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Serializer que impede emissão de token para usuário inativo."""

    def validate(self, attrs):
        data = super().validate(attrs)
        user = getattr(self, 'user', None)
        if user is not None and not getattr(user, 'is_active', True):
            # Interrompe o login se a conta ainda não foi verificada
            raise AuthenticationFailed('Conta inativa. Verifique seu e-mail.', code='user_inactive')
        return data


class ActiveUserTokenObtainPairView(TokenObtainPairView):
    serializer_class = ActiveUserTokenObtainPairSerializer
