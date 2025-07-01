import gspread
from oauth2client.service_account import ServiceAccountCredentials
import os
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CRED_PATH = os.path.join(BASE_DIR, 'credenciais.json')
SPREADSHEET_ID = '1NGTotnYUsIAKy3WYlwOUma6J7CQ4r3FetVq46AevJ4w'

def get_gspread_client():
    scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
    creds = ServiceAccountCredentials.from_json_keyfile_name(CRED_PATH, scope)
    return gspread.authorize(creds)

def get_sheet(sheet_name):
    client = get_gspread_client()
    sheet = client.open_by_key(SPREADSHEET_ID)
    worksheet = sheet.worksheet(sheet_name)
    return worksheet.get_all_records()

def get_sheet_data(sheet_name):
    data = get_sheet(sheet_name)
    return pd.DataFrame(data).fillna('')
