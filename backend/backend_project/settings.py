import os
from pathlib import Path
import dj_database_url

# Caminho base do projeto
BASE_DIR = Path(__file__).resolve().parent.parent

# ✅ DEBUG: Verificar se STATIC_ROOT está sendo montado corretamente
print("STATIC_ROOT DEFINIDO COMO:", STATIC_ROOT)  # Debug

# Chave secreta segura (mantenha segredo em produção!)
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'troque-essa-chave-para-producao')

# Debug baseado em variável de ambiente
DEBUG = os.getenv('DJANGO_DEBUG', 'False') == 'True'

# Domínios permitidos
ALLOWED_HOSTS = ['controle-producao-backend.onrender.com']

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

# CORS - permitir todos os domínios (seguro apenas para desenvolvimento)
CORS_ALLOW_ALL_ORIGINS = True

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
