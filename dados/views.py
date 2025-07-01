from rest_framework.decorators import api_view
from rest_framework.response import Response
from .google_sheets import get_sheet, get_gspread_client
from .planilha import carregar_planilha_como_dataframe
from dateutil.parser import parse  # <-- Certifique-se que essa linha está no topo do arquivo

@api_view(['GET'])
def exemplo(request):
    return Response({"mensagem": "API funcionando com sucesso!"})

@api_view(['GET'])
def geral(request):
    try:
        data = get_sheet('GERAL')
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def programacao(request):
    try:
        data = get_sheet('programação')
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def carteira(request):
    try:
        data = get_sheet('importCarteiraObra')
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def meta(request):
    try:
        data = get_sheet('meta')
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def seccionais(request):
    try:
        data = get_sheet('importCarteiraObra')
        seccional_col = [row.get('SECCIONAL') or row.get('SECCIONAL\nOBRA') for row in data]
        invalid_values = ['', None, '#N/A', 'N/A', 'na', 'NaN']
        seccional_unicos = sorted(set(
            v.strip() for v in seccional_col if v and v.strip() not in invalid_values
        ))
        return Response(seccional_unicos)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def status_sap_unicos(request):
    try:
        data = get_sheet('importCarteiraObra')

        # Captura o campo correto, mesmo com variações de nome
        status_sap_col = [row.get('STATUS SAP') or row.get('Status SAP') or '' for row in data]

        # Filtro de valores inválidos
        invalid = ['', None, '#N/A', 'N/A', 'na', 'NaN']
        unicos = sorted(set(
            s.strip() for s in status_sap_col if s and s.strip() not in invalid
        ))

        return Response(unicos)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
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
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def carteira_por_seccional(request):
    try:
        seccional_param = request.GET.get('seccional', '').strip()
        if not seccional_param:
            return Response({'error': 'Parâmetro "seccional" é obrigatório'}, status=400)

        data = get_sheet('importCarteiraObra')
        filtrado = [
            row for row in data
            if (row.get('SECCIONAL') or row.get('SECCIONAL\nOBRA', '')).strip() == seccional_param
        ]
        return Response(filtrado)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def status_ener_pep(request):
    try:
        data = get_sheet('importCarteiraObra')
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
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def status_conc_pep(request):
    try:
        data = get_sheet('importCarteiraObra')
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
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def status_servico_contagem(request):
    try:
        data = get_sheet('importCarteiraObra')
        contagem = {}

        for row in data:
            status = row.get('status serviço') or row.get('STATUS SERVIÇO') or row.get('Status Serviço')
            if not status:
                continue
            contagem[status.strip()] = contagem.get(status.strip(), 0) + 1

        return Response(contagem)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def seccional_rs_pep(request):
    try:
        data = get_sheet('importCarteiraObra')
        resultado = {}

        for row in data:
            seccional = (row.get('SECCIONAL') or row.get('SECCIONAL\nOBRA') or '').strip()
            pep = row.get('PEP')
            valor_str = row.get('R$') or row.get('RS') or row.get('VALOR')

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
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def matriz_dados(request):
    try:
        seccional_filtro = request.GET.get('seccional', '').strip()
        status_sap_filtro = request.GET.get('status_sap', '').strip()

        seccionais = [s.strip() for s in seccional_filtro.split(',') if s.strip()] if seccional_filtro else []
        status_saps = [s.strip() for s in status_sap_filtro.split(',') if s.strip()] if status_sap_filtro else []

        dados = carregar_planilha_como_dataframe('importCarteiraObra')

        dados_filtrados = []
        for row in dados:
            seccional = (row.get('SECCIONAL') or row.get('SECCIONAL\nOBRA') or '').strip()
            status_sap = (row.get('Status SAP') or '').strip()

            if seccionais and seccional not in seccionais:
                continue
            if status_saps and status_sap not in status_saps:
                continue

            pep = row.get('PEP')
            valor = row.get('R$') or row.get('RS') or row.get('VALOR')
            if not pep or not valor:
                continue

            dados_filtrados.append({
                'pep': pep,
                'prazo': row.get('Prazo', ''),
                'dataConclusao': row.get('Data Conclusão', ''),
                'statusSap': status_sap,
                'valor': valor,
                'seccional': seccional
            })

        return Response(dados_filtrados)

    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def tipos_unicos(request):
    try:
        data = get_sheet('importCarteiraObra')
        tipo_col = [row.get('TIPO') or '' for row in data]
        invalid = ['', None, '#N/A', 'N/A', 'na', 'NaN']
        unicos = sorted(set(
            s.strip() for s in tipo_col if s and s.strip() not in invalid
        ))
        return Response(unicos)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

import datetime

@api_view(['GET'])
def meses_conclusao(request):
    try:
        data = get_sheet('importCarteiraObra')  # Acessa a aba da planilha
        datas = [row.get('DATA CONCLUSÃO') or '' for row in data]  # Usa exatamente o nome da coluna
        meses = set()

        for d in datas:
            try:
                dt = parse(d.strip(), dayfirst=True)  # Interpreta corretamente como dd/mm/yyyy
                meses.add(dt.strftime('%Y-%m'))       # Formata como 'YYYY-MM'
            except Exception as e:
                print(f"ERRO ao parsear '{d}': {e}")
                continue

        return Response(sorted(meses))  # Exemplo de saída: ["2024-12", "2025-01"]
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
