from django.urls import path
from . import views
from .views import meses_conclusao

urlpatterns = [
    path('exemplo/', views.exemplo),
    path('geral/', views.geral),
    path('programacao/', views.programacao),
    path('carteira/', views.carteira),
    path('meta/', views.meta),
    path('defeitos/', views.defeitos),
    path('seccionais/', views.seccionais),
    path('status-sap-unicos/', views.status_sap_unicos),  # <-- NOVO ENDPOINT
    path('carteira_por_seccional/', views.carteira_por_seccional),
    path('status-ener-pep/', views.status_ener_pep),
    path('status-conc-pep/', views.status_conc_pep),
    path('status-servico-contagem/', views.status_servico_contagem),
    path('seccional-rs-pep/', views.seccional_rs_pep),
    path('matriz-dados/', views.matriz_dados),
    path('tipos-unicos/', views.tipos_unicos),
    path('meses-conclusao/', views.meses_conclusao),
]
