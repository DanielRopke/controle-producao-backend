import os
import json
import base64
import gspread
from google.oauth2.service_account import Credentials

def get_sheet(sheet_name):
    try:
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

        spreadsheet_id = os.environ.get("GOOGLE_SHEETS_SPREADSHEET_ID")
        if not spreadsheet_id:
            raise Exception("Variável GOOGLE_SHEETS_SPREADSHEET_ID não encontrada")

        spreadsheet = client.open_by_key(spreadsheet_id)
        worksheet = spreadsheet.worksheet(sheet_name)

        # Alteração aqui: retorna os dados da planilha, não o objeto worksheet
        return worksheet.get_all_records()

    except Exception as e:
        print("Erro ao acessar planilha:", e)
        raise
