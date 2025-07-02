import os
import json
import base64
import gspread
from google.oauth2.service_account import Credentials

def get_sheet(sheet_name):
    try:
        # Pega a variável base64 das credenciais
        credentials_base64 = os.environ.get("GOOGLE_SHEETS_CREDENTIALS_JSON_BASE64")
        if not credentials_base64:
            raise Exception("Variável GOOGLE_SHEETS_CREDENTIALS_JSON_BASE64 não encontrada")

        # Decodifica para JSON string
        credentials_json = base64.b64decode(credentials_base64).decode("utf-8")
        credentials_info = json.loads(credentials_json)

        # Escopos para Google Sheets e Drive
        scopes = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive",
        ]

        # Cria credenciais com pacote google.oauth2
        credentials = Credentials.from_service_account_info(credentials_info, scopes=scopes)

        # Autoriza o cliente gspread com essas credenciais
        client = gspread.authorize(credentials)

        # Pega o ID da planilha da variável de ambiente
        spreadsheet_id = os.environ.get("GOOGLE_SHEETS_SPREADSHEET_ID")
        if not spreadsheet_id:
            raise Exception("Variável GOOGLE_SHEETS_SPREADSHEET_ID não encontrada")

        # Abre a planilha e retorna a aba solicitada
        spreadsheet = client.open_by_key(spreadsheet_id)
        worksheet = spreadsheet.worksheet(sheet_name)
        return worksheet

    except Exception as e:
        print("Erro ao acessar planilha:", e)
        raise
