import os
import json
import base64
import unicodedata
import gspread
from google.oauth2.service_account import Credentials

def _normalize_name(s: str) -> str:
    if not s:
        return ''
    # Remove acentos e normaliza para comparação case-insensitive
    nfd = unicodedata.normalize('NFD', s)
    no_diac = ''.join(ch for ch in nfd if unicodedata.category(ch) != 'Mn')
    return no_diac.strip().lower()


def get_sheet(sheet_name):
    """
    Busca dados de uma aba específica da planilha Google Sheets.
    Recebe o nome da aba e retorna os registros como lista de dicts.
    """
    try:
        print(f"[get_sheet] sheet_name: {sheet_name}")
        credentials_base64 = os.environ.get("GOOGLE_SHEETS_CREDENTIALS_JSON_BASE64")
        if not credentials_base64:
            print("[get_sheet] Variável GOOGLE_SHEETS_CREDENTIALS_JSON_BASE64 não encontrada")
            raise Exception("Variável GOOGLE_SHEETS_CREDENTIALS_JSON_BASE64 não encontrada")

        credentials_json = base64.b64decode(credentials_base64).decode("utf-8")
        print("[get_sheet] Credenciais decodificadas")
        credentials_info = json.loads(credentials_json)

        scopes = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive",
        ]

        credentials = Credentials.from_service_account_info(credentials_info, scopes=scopes)
        print("[get_sheet] Credenciais carregadas para o Google")
        client = gspread.authorize(credentials)
        print("[get_sheet] Cliente gspread autorizado")

        spreadsheet_id = os.environ.get("GOOGLE_SHEETS_SPREADSHEET_ID")
        if not spreadsheet_id:
            print("[get_sheet] Variável GOOGLE_SHEETS_SPREADSHEET_ID não encontrada")
            raise Exception("Variável GOOGLE_SHEETS_SPREADSHEET_ID não encontrada")

        print(f"[get_sheet] Abrindo planilha com ID: {spreadsheet_id}")
        spreadsheet = client.open_by_key(spreadsheet_id)
        print(f"[get_sheet] Buscando aba: {sheet_name}")
        try:
            worksheet = spreadsheet.worksheet(sheet_name)
        except Exception as exc:
            print(f"[get_sheet] Worksheet exata '{sheet_name}' não encontrada: {exc}. Tentando busca normalizada...")
            target = _normalize_name(sheet_name)
            worksheet = None
            try:
                for ws in spreadsheet.worksheets():
                    if _normalize_name(ws.title) == target:
                        worksheet = ws
                        print(f"[get_sheet] Worksheet encontrada por nome normalizado: '{ws.title}'")
                        break
            except Exception as e2:
                print("[get_sheet] Falha ao listar worksheets:", e2)
            if worksheet is None:
                # Tentativas comuns: variantes de 'programacao'/'programação'
                aliases = [sheet_name, 'Programação', 'programação', 'Programacao', 'programacao']
                for alias in aliases:
                    try:
                        worksheet = spreadsheet.worksheet(alias)
                        print(f"[get_sheet] Worksheet encontrada por alias: '{alias}'")
                        break
                    except Exception:
                        continue
            if worksheet is None:
                raise
        print(f"[get_sheet] Worksheet encontrada: {worksheet.title}")
        records = worksheet.get_all_records()
        print(f"[get_sheet] Registros encontrados: {len(records)}")
        return records

    except Exception as e:
        print("[get_sheet] Erro ao acessar planilha:", e)
        import traceback
        traceback.print_exc()
        raise


def get_gspread_client():
    """
    Cria e retorna um cliente gspread autorizado usando as mesmas credenciais
    lidas da variável de ambiente GOOGLE_SHEETS_CREDENTIALS_JSON_BASE64.
    """
    credentials_base64 = os.environ.get("GOOGLE_SHEETS_CREDENTIALS_JSON_BASE64")
    if not credentials_base64:
        raise Exception("Variável GOOGLE_SHEETS_CREDENTIALS_JSON_BASE64 não encontrada")
    credentials_json = base64.b64decode(credentials_base64).decode("utf-8")
    credentials_info = json.loads(credentials_json)
    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
    ]
    credentials = Credentials.from_service_account_info(credentials_info, scopes=scopes)
    client = gspread.authorize(credentials)
    return client
