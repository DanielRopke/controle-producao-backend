from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
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
from .serializers import MatrizItemSerializer
from dateutil.parser import parse
import os


@api_view(['GET'])
def exemplo(request):
    """
    Endpoint de exemplo para testar funcionamento da API.
    """
    return Response({"mensagem": "API funcionando com sucesso!"})


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
