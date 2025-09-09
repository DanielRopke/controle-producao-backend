import os
from pathlib import Path
import dj_database_url
from dotenv import load_dotenv

# Caminho base do projeto
BASE_DIR = Path(__file__).resolve().parent.parent

# Carrega variáveis de ambiente de arquivos locais (somente em dev). Em produção,
# as variáveis já vêm do ambiente do serviço (Render, etc.).
load_dotenv(BASE_DIR / '.env')
load_dotenv(BASE_DIR / '.env.local', override=True)

# Chave secreta segura (mantenha segredo em produção!)
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'troque-essa-chave-para-producao')

# Debug baseado em variável de ambiente
DEBUG = os.getenv('DJANGO_DEBUG', 'False') == 'True'

# Domínios permitidos (env > default)
ALLOWED_HOSTS = [h.strip() for h in os.getenv('ALLOWED_HOSTS', 'controle-producao-backend.onrender.com,localhost,127.0.0.1').split(',') if h.strip()]

# Aplicativos instalados
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Terceiros
    'rest_framework',
    'corsheaders',

    # Seu app principal
    'dados',
]

# Middleware da aplicação
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Deve vir antes de CommonMiddleware
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Serve arquivos estáticos no deploy
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# URLs
ROOT_URLCONF = 'backend_project.urls'

# Templates
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# WSGI
WSGI_APPLICATION = 'backend_project.wsgi.application'

# Banco de dados com fallback para SQLite
DATABASES = {
    'default': dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600
    )
}


# CORS - permitir frontend local e produção
from corsheaders.defaults import default_headers

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = list(default_headers) + [
    'access-control-allow-origin',
]

# Métodos HTTP permitidos
from corsheaders.defaults import default_methods
CORS_ALLOW_METHODS = list(default_methods) + [
    'PATCH',
    'OPTIONS',
]

FRONTEND_ORIGINS_ENV = os.getenv('FRONTEND_ORIGINS', '')
FRONTEND_ORIGINS_LIST = [o.strip() for o in FRONTEND_ORIGINS_ENV.split(',') if o.strip()]
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
    CORS_ALLOWED_ORIGINS = FRONTEND_ORIGINS_LIST or [
        "http://localhost:5173",
    ]
else:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = FRONTEND_ORIGINS_LIST or [
        "https://www.controlesetup.com.br",
    ]

# CSRF Trusted Origins (para evitar bloqueios em formulários quando aplicável)
CSRF_TRUSTED_ORIGINS = [
    o.strip() for o in os.getenv(
        'CSRF_TRUSTED_ORIGINS', 'http://localhost:5173,https://www.controlesetup.com.br'
    ).split(',') if o.strip()
]

# Idioma e fuso horário
LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_L10N = True
USE_TZ = True

# ====== ARQUIVOS ESTÁTICOS ======
STATIC_URL = '/static/'

# LOCAL ONDE O COLLECTSTATIC VAI JUNTAR OS ARQUIVOS
STATIC_ROOT = os.path.abspath(os.path.join(BASE_DIR, 'staticfiles'))

# Evitar prints em produção

# DURANTE O DESENVOLVIMENTO (opcional)
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')]

# WhiteNoise (servir os estáticos no Render sem nginx)
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Arquivos de mídia (caso use uploads)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Segurança para produção
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 3600
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# Configuração do Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

# ====== E-mail e Links ======
FRONTEND_BASE_URL = os.getenv('FRONTEND_BASE_URL', 'http://localhost:5173')

if os.getenv('EMAIL_HOST'):
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = os.getenv('EMAIL_HOST')
    EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
    EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
    EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
    EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'true').lower() == 'true'
    DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER or 'no-reply@controlesetup.com.br')
else:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    DEFAULT_FROM_EMAIL = 'no-reply@controlesetup.com.br'
