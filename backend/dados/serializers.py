from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.validators import validate_email
from django.core.exceptions import ValidationError

User = get_user_model()

class MatrizItemSerializer(serializers.Serializer):
    """
    Serializer para itens da matriz de prazos SAP.
    """
    pep = serializers.CharField()
    prazo = serializers.CharField()
    dataConclusao = serializers.CharField()
    statusSap = serializers.CharField()
    valor = serializers.CharField()
    seccional = serializers.CharField()
    tipo = serializers.CharField()


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    matricula = serializers.CharField(max_length=50)
    password = serializers.CharField(write_only=True, min_length=9)

    def validate_email(self, value: str):
        try:
            validate_email(value)
        except ValidationError:
            raise serializers.ValidationError("E-mail inválido.")
        if not value.lower().endswith("@gruposetup.com"):
            raise serializers.ValidationError("Use o e-mail empresarial @gruposetup.com.")
        return value

    def validate_username(self, value: str):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Usuário já existe.")
        return value

    def validate(self, attrs):
        pwd = attrs.get('password') or ''
        if len(pwd) <= 8 or not any(c.islower() for c in pwd) or not any(c.isupper() for c in pwd) or pwd.isalnum():
            raise serializers.ValidationError({
                'password': 'Senha fraca: mínimo 9 caracteres com maiúscula, minúscula e caractere especial.'
            })
        return attrs

    def create(self, validated_data):
        username = validated_data['username'].strip()
        email = validated_data['email'].strip().lower()
        matricula = validated_data['matricula'].strip()
        password = validated_data['password']
        user = User(
            username=username,
            email=email,
            first_name=matricula,  # armazena matrícula sem criar migrations
            is_active=False,        # aguardará verificação por e-mail
            is_staff=False,
            is_superuser=False,
        )
        user.set_password(password)
        user.save()
        return user
