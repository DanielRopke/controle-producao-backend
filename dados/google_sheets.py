import os
import json
import base64
import gspread
from google.oauth2.service_account import Credentials

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
        worksheet = spreadsheet.worksheet(sheet_name)
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
