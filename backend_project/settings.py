# backend_project/settings.py

from pathlib import Path
import os
import dj_database_url
from corsheaders.defaults import default_headers

# Diretório base do projeto
BASE_DIR = Path(__file__).resolve().parent.parent

# ATENÇÃO: Em produção, use uma variável de ambiente para SECRET_KEY
SECRET_KEY = 'django-insecure-j(cw(nmdcx3+vxo@t+kfy+(2b36*fwk(q$xbwsvfg_um#mn&#-'

# DEBUG deve ser False em produção
DEBUG = True

# Configure os domínios permitidos
ALLOWED_HOSTS = ['*']

# Aplicações instaladas
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',         # Django REST Framework
    'corsheaders',            # CORS
    'dados',                  # Sua app
]

# Middlewares utilizados
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # CORS deve vir primeiro
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# URLs principais do projeto
ROOT_URLCONF = 'backend_project.urls'

# Configuração de templates
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# WSGI
WSGI_APPLICATION = 'backend_project.wsgi.application'

# Banco de dados - Usando PostgreSQL do Railway
DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get("DATABASE_URL"),
        conn_max_age=600,
        ssl_require=True,
    )
}

# Validações de senha
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internacionalização
LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = True

# Arquivos estáticos
STATIC_URL = 'static/'

# Auto campo padrão para models
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS - Origem permitida para o frontend Vite (React)
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]

# Permitir envio de cookies e headers personalizados
CORS_ALLOW_CREDENTIALS = True

# Permitir headers personalizados além dos padrões
CORS_ALLOW_HEADERS = list(default_headers) + [
    'contenttype',
]
