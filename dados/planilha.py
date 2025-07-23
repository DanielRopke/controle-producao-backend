from .google_sheets import get_sheet

def carregar_planilha_como_dataframe(sheet_name):
    """
    Carrega dados de uma aba da planilha Google Sheets como dataframe (lista de dicts).
    """
    return get_sheet(sheet_name)
