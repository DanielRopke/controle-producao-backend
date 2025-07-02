from .google_sheets import get_sheet

def carregar_planilha_como_dataframe(sheet_name):
    return get_sheet(sheet_name)
