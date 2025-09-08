from rest_framework.decorators import api_view, permission_classes
# Nota: alteração inócua para acionar deploy no Render e testar envio de e-mail de confirmação (2)
from rest_framework.permissions import IsAuthenticated, AllowAny
from .google_sheets import get_sheet, get_gspread_client

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def colunas_planilha(request):
    """
    Retorna os títulos das colunas (cabecalhos) de uma aba da planilha.
    Aceita query param `aba` com o nome da aba; padrão: 'Prazos SAP'.
    """
    try:
        aba = (request.GET.get('aba') or 'Prazos SAP').strip()
        if not aba:
            return Response({'error': 'Parâmetro "aba" inválido.'}, status=400)
        # Usamos a função de carregamento já existente para garantir compatibilidade
        dados = carregar_planilha_como_dataframe(aba)
        if not dados:
            return Response({'error': f'Nenhum dado encontrado na aba "{aba}".'}, status=404)
        primeira_linha = dados[0]
        # Retornar as chaves na ordem encontrada
        return Response({'aba': aba, 'colunas': list(primeira_linha.keys())})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from django.http import JsonResponse, HttpResponseForbidden
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json
import logging
import threading
import time

# Cache simples em memória para dados de abas do Google Sheets
_sheet_cache = {}
_sheet_cache_lock = threading.Lock()
_CACHE_TTL = 300  # segundos (5 minutos)

def get_sheet_cached(sheet_name):
    now = time.time()
    with _sheet_cache_lock:
        cache_entry = _sheet_cache.get(sheet_name)
        if cache_entry:
            cached_time, cached_data = cache_entry
            if now - cached_time < _CACHE_TTL:
                return cached_data
        # Não está no cache ou expirou, buscar do Google Sheets
        data = get_sheet(sheet_name)
        _sheet_cache[sheet_name] = (now, data)
        return data
from .planilha import carregar_planilha_como_dataframe
from .serializers import MatrizItemSerializer, RegisterSerializer
from dateutil.parser import parse
import os
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q

User = get_user_model()


@api_view(['GET'])
def exemplo(request):
    """
    Endpoint de exemplo para testar funcionamento da API.
    """
    return Response({"mensagem": "API funcionando com sucesso!"})


@api_view(['POST'])
@permission_classes([AllowAny])
def auth_register(request):
    """Registra usuário novo ou lida com e-mail já existente conforme regras de mensagem."""
    data = request.data or {}
    username = (data.get('username') or '').strip()
    email = (data.get('email') or '').strip().lower()
    matricula = (data.get('matricula') or '').strip()
    password = data.get('password') or ''
    timer_running = bool(data.get('timer_running'))  # vindo do frontend

    # Validações mínimas (mimetiza RegisterSerializer)
    if not email or not email.endswith('@gruposetup.com'):
        return Response({'email': 'Use o e-mail empresarial @gruposetup.com.'}, status=400)
    if len(password) <= 8 or not any(c.islower() for c in password) or not any(c.isupper() for c in password) or password.isalnum():
        return Response({'password': 'Senha fraca: mínimo 9 caracteres com maiúscula, minúscula e caractere especial.'}, status=400)
    if not matricula:
        return Response({'matricula': 'Informe a matrícula.'}, status=400)

    # Se já existe usuário com este e-mail
    try:
        existing = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        existing = None

    if existing:
        if existing.is_active:
            # Caso 1: usuário ativo -> bloquear
            return Response({'message': 'Email já Cadastrado a um Usuário'}, status=400)
        # Caso 2: usuário existe e está inativo -> enviar/verificar email novamente
        uid = urlsafe_base64_encode(force_bytes(existing.pk))
        token = default_token_generator.make_token(existing)
        frontend_base = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:5173').rstrip('/')
        verify_link = f"{frontend_base}/cadastro?uid={uid}&token={token}"

        subject = "Verifique seu cadastro"
        body = (
            "Olá,\n\n"
            "Seu cadastro está pendente de confirmação. Confirme pelo link abaixo:\n"
            f"{verify_link}\n\n"
            "Se não foi você, ignore esta mensagem."
        )
        try:
            send_mail(
                subject,
                body,
                getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@controlesetup.com.br'),
                [existing.email],
                fail_silently=False,
            )
        except Exception as e:
            print('ERROR sending verification email (register-existing-inactive):', repr(e))
            print('Verification link (register-existing-inactive):', verify_link)

        # Mensagem depende apenas do estado do timer no frontend
        msg = 'Email de Confirmação Já Enviado' if timer_running else 'Email de Confirmação Reenviado'
        resp = {'message': msg}
        if getattr(settings, 'DEBUG', False):
            resp['debug_verify_link'] = verify_link
        return Response(resp, status=200)

    # Caso 3: não existe -> criar e enviar
    ser = RegisterSerializer(data=data)
    ser.is_valid(raise_exception=True)
    user = ser.save()

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    frontend_base = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:5173').rstrip('/')
    verify_link = f"{frontend_base}/cadastro?uid={uid}&token={token}"

    subject = "Verifique seu cadastro"
    body = (
        "Olá,\n\n"
        "Recebemos seu cadastro. Para ativar sua conta, confirme pelo link abaixo:\n"
        f"{verify_link}\n\n"
        "Se não foi você, ignore esta mensagem."
    )
    try:
        send_mail(subject, body, getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@controlesetup.com.br'), [user.email], fail_silently=False)
    except Exception as e:
        print('ERROR sending verification email (register-new):', repr(e))
        print('Verification link (register-new):', verify_link)

    resp = {'message': 'Email de Confirmação Enviado'}
    if getattr(settings, 'DEBUG', False):
        resp['debug_verify_link'] = verify_link
    return Response(resp, status=201)


@api_view(['POST'])
@permission_classes([AllowAny])
def auth_verify_email(request):
    """Confirma e ativa a conta a partir de uid+token."""
    uidb64 = request.data.get('uid')
    token = request.data.get('token')
    if not uidb64 or not token:
        return Response({'detail': 'Parâmetros inválidos.'}, status=400)
    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = User.objects.get(pk=uid)
    except Exception:
        return Response({'detail': 'Link inválido.'}, status=400)
    if not default_token_generator.check_token(user, token):
        return Response({'detail': 'Token inválido ou expirado.'}, status=400)
    user.is_active = True
    user.save(update_fields=['is_active'])
    return Response({'message': 'Conta verificada com sucesso.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def auth_resend_confirmation(request):
    """Reenvia e-mail de confirmação para contas inativas.

    Entrada: { email: string, timer_running?: boolean }
    Saída: message conforme timer_running.
    """
    data = request.data or {}
    email = (data.get('email') or '').strip().lower()
    timer_running = bool(data.get('timer_running'))

    if not email or not email.endswith('@gruposetup.com'):
        return Response({'email': 'Use o e-mail empresarial @gruposetup.com.'}, status=400)

    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        # E-mail não cadastrado
        return Response({'message': 'Email de Confirmação Enviado'}, status=200)

    if user.is_active:
        return Response({'message': 'Email já Cadastrado a um Usuário'}, status=400)

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    frontend_base = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:5173').rstrip('/')
    verify_link = f"{frontend_base}/cadastro?uid={uid}&token={token}"

    subject = "Verifique seu cadastro"
    body = (
        "Olá,\n\n"
        "Seu cadastro está pendente de confirmação. Confirme pelo link abaixo:\n"
        f"{verify_link}\n\n"
        "Se não foi você, ignore esta mensagem."
    )
    try:
        send_mail(subject, body, getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@controlesetup.com.br'), [user.email], fail_silently=False)
    except Exception as e:
        print('ERROR sending verification email (resend):', repr(e))
        print('Verification link (resend):', verify_link)

    msg = 'Email de Confirmação Já Enviado' if timer_running else 'Email de Confirmação Reenviado'
    resp = {'message': msg}
    if getattr(settings, 'DEBUG', False):
        resp['debug_verify_link'] = verify_link
    return Response(resp, status=200)





@api_view(['GET'])
@permission_classes([IsAuthenticated])
def geral(request):
    """
    Retorna dados gerais da planilha 'GERAL'.
    """
    try:
        data = get_sheet_cached('GERAL')
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def programacao(request):
    """
    Retorna dados da aba 'programação' da planilha.
    """
    try:
        data = get_sheet_cached('programação')
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def carteira(request):
    """
    Retorna dados da aba 'Prazos SAP' da planilha.
    """
    try:
        data = get_sheet_cached('Prazos SAP')
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def meta(request):
    try:
        data = get_sheet_cached('meta')
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def seccionais(request):
    try:
        print('--- [LOG] INICIO /api/seccionais/ ---')
        data = get_sheet_cached('Prazos SAP')
        print(f'[LOG] get_sheet retornou {len(data) if data else 0} linhas')
        if not data:
            print('[ERRO] get_sheet retornou None ou lista vazia!')
            return Response({'error': 'Nenhum dado encontrado na planilha.'}, status=404)
        seccional_col = []
        for idx, row in enumerate(data):
            val = row.get('SECCIONAL') or row.get('SECCIONAL\nOBRA')
            if val is None:
                print(f'[WARN] Linha {idx} sem SECCIONAL nem SECCIONAL\\nOBRA: {row}')
            seccional_col.append(val)
        print('[LOG] Coluna SECCIONAL extraída:', seccional_col)
        invalid_values = ['', None, '#N/A', 'N/A', 'na', 'NaN']
        seccional_unicos = sorted(set(
            v.strip() for v in seccional_col if v and v.strip() not in invalid_values
        ))
        print('[LOG] Seccionais únicos:', seccional_unicos)
        print('--- [LOG] FIM /api/seccionais/ ---')
        return Response(seccional_unicos)
    except Exception as e:
        import traceback
        print('[ERRO] Exceção em /api/seccionais/:', e)
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def status_sap_unicos(request):
    try:
        print('--- [LOG] INICIO /api/status_sap_unicos/ ---')
        data = get_sheet_cached('Prazos SAP')
        print(f'[LOG] get_sheet retornou {len(data) if data else 0} linhas')
        if not data:
            print('[ERRO] get_sheet retornou None ou lista vazia!')
            return Response({'error': 'Nenhum dado encontrado na planilha.'}, status=404)
        status_sap_col = []
        for idx, row in enumerate(data):
            val = row.get('STATUS SAP') or row.get('Status SAP') or ''
            if not val:
                print(f'[WARN] Linha {idx} sem STATUS SAP: {row}')
            status_sap_col.append(val)
        invalid = ['', None, '#N/A', 'N/A', 'na', 'NaN']
        unicos = sorted(set(
            s.strip() for s in status_sap_col if s and s.strip() not in invalid
        ))
        print('[LOG] Status SAP únicos:', unicos)
        print('--- [LOG] FIM /api/status_sap_unicos/ ---')
        return Response(unicos)
    except Exception as e:
        import traceback
        print('[ERRO] Exceção em /api/status_sap_unicos/:', e)
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def defeitos(request):
    try:
        gc = get_gspread_client()
        sh = gc.open_by_key('1NGTotnYUsIAKy3WYlwOUma6J7CQ4r3FetVq46AevJ4w')
        worksheet = sh.worksheet('ImportDefeitos')
        all_data = worksheet.get_all_values()
        headers = all_data[0]
        rows = all_data[1:]
        seen = {}
        unique_headers = []
        for h in headers:
            h = h.strip() or 'vazio'
            count = seen.get(h, 0)
            new_header = f"{h}_{count}" if count > 0 else h
            unique_headers.append(new_header)
            seen[h] = count + 1
        data = [dict(zip(unique_headers, row)) for row in rows]
        return Response(data)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def carteira_por_seccional(request):
    try:
        seccional_param = request.GET.get('seccional', '').strip()
        if not seccional_param:
            return Response({'error': 'Parâmetro "seccional" é obrigatório'}, status=400)
        data = get_sheet_cached('Prazos SAP')
        filtrado = [
            row for row in data
            if (row.get('SECCIONAL') or row.get('SECCIONAL\nOBRA', '')).strip() == seccional_param
        ]
        return Response(filtrado)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def status_ener_pep(request):
    try:
        data = get_sheet_cached('Prazos SAP')
        ignorar = {"em andamento", "fechada"}
        contagem = {}
        for row in data:
            status = (row.get('Status ENER') or row.get('STATUS ENER') or "").strip()
            pep = row.get('PEP')
            seccional = (row.get('SECCIONAL') or row.get('SECCIONAL\nOBRA') or "").strip()
            if not status or not pep or not seccional:
                continue
            if status.lower() in ignorar:
                continue
            contagem.setdefault(status, {})
            contagem[status][seccional] = contagem[status].get(seccional, 0) + 1
        return Response(contagem)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def status_conc_pep(request):
    try:
        data = get_sheet_cached('Prazos SAP')
        ignorar = {"em andamento", "fechada"}
        contagem = {}
        for row in data:
            status = (row.get('Status CONC') or row.get('STATUS CONC') or "").strip()
            pep = row.get('PEP')
            seccional = (row.get('SECCIONAL') or row.get('SECCIONAL\nOBRA') or "").strip()
            if not status or not pep or not seccional:
                continue
            if status.lower() in ignorar:
                continue
            contagem.setdefault(status, {})
            contagem[status][seccional] = contagem[status].get(seccional, 0) + 1
        return Response(contagem)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def status_servico_contagem(request):
    try:
        seccional_filtro = request.GET.get('seccional', '').strip()
        seccionais = [s.strip() for s in seccional_filtro.split(',') if s.strip()] if seccional_filtro else []
        status_sap_filtro = request.GET.get('status_sap', '').strip()
        tipo_filtro = request.GET.get('tipo', '').strip()
        mes_filtro = request.GET.get('mes', '').strip()
        data = get_sheet_cached('Prazos SAP')
        contagem = {}
        for row in data:
            status = row.get('status serviço') or row.get('STATUS SERVIÇO') or row.get('Status Serviço')
            seccional = (row.get('SECCIONAL') or row.get('SECCIONAL\nOBRA') or '').strip()
            status_sap = (row.get('STATUS SAP') or '').strip()
            tipo = (row.get('TIPO') or '').strip()
            data_conclusao = (row.get('DATA CONCLUSÃO') or '').strip()
            # Filtros
            if seccionais and seccional not in seccionais:
                continue
            if status_sap_filtro and status_sap_filtro != status_sap:
                continue
            if tipo_filtro and tipo_filtro != tipo:
                continue
            if mes_filtro:
                from dateutil.parser import parse
                try:
                    dt = parse(data_conclusao, dayfirst=True)
                    if dt.strftime('%Y-%m') != mes_filtro:
                        continue
                except:
                    continue
            if not status or not seccional:
                continue
            status = status.strip()
            if not status:
                continue
            if status not in contagem:
                contagem[status] = {}
            contagem[status][seccional] = contagem[status].get(seccional, 0) + 1
        return Response(contagem)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def seccional_rs_pep(request):
    try:
        data = get_sheet_cached('Prazos SAP')
        seccional_filtro = request.GET.get('seccional', '').strip()
        seccionais = [s.strip() for s in seccional_filtro.split(',') if s.strip()] if seccional_filtro else []
        status_sap_filtro = request.GET.get('status_sap', '').strip()
        tipo_filtro = request.GET.get('tipo', '').strip()
        mes_filtro = request.GET.get('mes', '').strip()
        resultado = {}
        for row in data:
            seccional = (row.get('SECCIONAL') or row.get('SECCIONAL\nOBRA') or '').strip()
            pep = row.get('PEP')
            valor_str = row.get('R$') or row.get('RS') or row.get('VALOR')
            status_sap = (row.get('STATUS SAP') or '').strip()
            tipo = (row.get('TIPO') or '').strip()
            data_conclusao = (row.get('DATA CONCLUSÃO') or '').strip()
            # Filtros
            if seccionais and seccional not in seccionais:
                continue
            if status_sap_filtro and status_sap_filtro != status_sap:
                continue
            if tipo_filtro and tipo_filtro != tipo:
                continue
            if mes_filtro:
                from dateutil.parser import parse
                try:
                    dt = parse(data_conclusao, dayfirst=True)
                    if dt.strftime('%Y-%m') != mes_filtro:
                        continue
                except:
                    continue
            if not seccional or not pep:
                continue
            try:
                valor = float(str(valor_str).replace("R$", "").replace(".", "").replace(",", ".")) if valor_str else 0
            except:
                valor = 0
            if seccional not in resultado:
                resultado[seccional] = {"valor": 0, "pep_count": 0}
            resultado[seccional]["valor"] += valor
            resultado[seccional]["pep_count"] += 1
        return Response(resultado)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def matriz_dados(request):
    try:
        seccional_filtro = request.GET.get('seccional', '').strip()
        status_sap_filtro = request.GET.get('status_sap', '').strip()
        tipo_filtro = request.GET.get('tipo', '').strip()
        mes_filtro = request.GET.get('mes', '').strip()
        data_inicio = request.GET.get('data_inicio', '').strip()
        data_fim = request.GET.get('data_fim', '').strip()

        seccionais = [s.strip() for s in seccional_filtro.split(',') if s.strip()] if seccional_filtro else []
        status_saps = [s.strip() for s in status_sap_filtro.split(',') if s.strip()] if status_sap_filtro else []
        tipos = [s.strip() for s in tipo_filtro.split(',') if s.strip()] if tipo_filtro else []

        dados = carregar_planilha_como_dataframe('Prazos SAP')
        dados_filtrados = []

        for row in dados:
            seccional = (row.get('SECCIONAL') or row.get('SECCIONAL\nOBRA') or '').strip()
            status_sap = (row.get('STATUS SAP') or '').strip()
            tipo = (row.get('TIPO') or '').strip()
            data_conclusao = (row.get('DATA CONCLUSÃO') or '').strip()

            if seccionais and seccional not in seccionais:
                continue
            if status_saps and status_sap not in status_saps:
                continue
            if tipos and tipo not in tipos:
                continue

            if mes_filtro:
                try:
                    dt = parse(data_conclusao, dayfirst=True)
                    if dt.strftime('%Y-%m') != mes_filtro:
                        continue
                except:
                    continue

            if data_inicio and data_fim:
                try:
                    dt = parse(data_conclusao, dayfirst=True).date()
                    dt_inicio = parse(data_inicio, dayfirst=True).date()
                    dt_fim = parse(data_fim, dayfirst=True).date()
                    if not (dt_inicio <= dt <= dt_fim):
                        continue
                except:
                    continue

            pep = row.get('PEP')
            valor = row.get('R$') or row.get('RS') or row.get('VALOR')
            if not pep or not valor:
                continue

            # Log para depuração dos valores lidos
            if not row.get('PRAZO'):
                print(f"Linha sem PRAZO: {row}")
            if not row.get('STATUS SAP'):
                print(f"Linha sem STATUS SAP: {row}")

            dados_filtrados.append({
                'pep': pep,
                'prazo': row.get('PRAZO', ''),
                'dataConclusao': data_conclusao,
                'statusSap': row.get('STATUS SAP', ''),
                'valor': valor,
                'seccional': seccional,
                'tipo': tipo
            })

        return Response(dados_filtrados)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def tipos_unicos(request):
    try:
        data = get_sheet_cached('Prazos SAP')
        tipo_col = [row.get('TIPO') or '' for row in data]
        invalid = ['', None, '#N/A', 'N/A', 'na', 'NaN']
        unicos = sorted(set(
            s.strip() for s in tipo_col if s and s.strip() not in invalid
        ))
        return Response(unicos)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def meses_conclusao(request):
    try:
        data = get_sheet_cached('Prazos SAP')
        datas = [row.get('DATA CONCLUSÃO') or '' for row in data]
        meses = set()
        for d in datas:
            try:
                dt = parse(d.strip(), dayfirst=True)
                meses.add(dt.strftime('%Y-%m'))
            except Exception as e:
                print(f"ERRO ao parsear '{d}': {e}")
                continue
        return Response(sorted(meses))
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)
