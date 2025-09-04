from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from dados.jwt_views import ActiveUserTokenObtainPairView

def home(request):
    return JsonResponse({"message": "Backend Django está funcionando!"})

urlpatterns = [
    path('', home),  # rota raiz
    path('admin/', admin.site.urls),
    path('api/', include('dados.urls')),
    # JWT Auth
    path('api/token/', ActiveUserTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# ⚠️ Esta linha precisa vir depois de definir urlpatterns
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
