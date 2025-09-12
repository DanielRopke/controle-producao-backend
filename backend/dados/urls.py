from django.urls import path
from . import views

urlpatterns = [
    path('exemplo/', views.exemplo),
    path('geral/', views.geral),
    path('programacao/', views.programacao),
    path('faturamento/', views.faturamento),
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
    path('sheets-status/', views.sheets_status),
    # Auth (cadastro e verificação)
    path('auth/register', views.auth_register),
    path('auth/verify-email', views.auth_verify_email),
    path('auth/resend-confirmation', views.auth_resend_confirmation),
    path('auth/password-reset', views.auth_password_reset),
    path('auth/password-reset-confirm', views.auth_password_reset_confirm),
    path('auth/check-email', views.auth_check_email),
    # debug: outbound ip (temporário)
    path('_debug/test-smtp/', views.debug_test_smtp),
    path('_debug/outbound-ip/', views.outbound_ip),
    path('_debug/send-test-email/', views.debug_send_test_email),
]
