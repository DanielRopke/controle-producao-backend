import os
import json
import base64
import unicodedata
import gspread
from google.oauth2.service_account import Credentials

# Utilitários simples para localizar o ID da planilha em diferentes fontes
def _read_env_file(path: str) -> dict:
    """Lê um arquivo .env simples (KEY=VALUE) e retorna um dict.
    Ignora linhas em branco e comentários. Não faz expansão.
    """
    try:
        if not os.path.exists(path):
            return {}
        data = {}
        with open(path, 'r', encoding='utf-8') as fh:
            for line in fh:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '=' in line:
                    k, v = line.split('=', 1)
                    data[k.strip()] = v.strip().strip('"').strip("'")
        return data
    except Exception:
        return {}

def _get_spreadsheet_id_fallback() -> str | None:
    """Obtém o ID da planilha a partir de múltiplas fontes:
    1) Variável de ambiente GOOGLE_SHEETS_SPREADSHEET_ID
    2) Arquivos locais comuns (backend/.env, .env na raiz)
    3) Variáveis do frontend (.env*, chave VITE_GOOGLE_SHEETS_SPREADSHEET_ID)
    Retorna o ID ou None se não encontrado.
    """
    # 1) Ambiente
    sid = os.environ.get("GOOGLE_SHEETS_SPREADSHEET_ID")
    if sid:
        return sid.strip()

    # 2) Arquivos .env no backend e na raiz do repositório
    here = os.path.abspath(os.path.dirname(__file__))
    backend_dir = os.path.abspath(os.path.join(here, '..'))
    repo_root = os.path.abspath(os.path.join(backend_dir, '..'))

    candidates = [
        os.path.join(backend_dir, '.env.local'),
        os.path.join(backend_dir, '.env'),
        os.path.join(repo_root, '.env.local'),
        os.path.join(repo_root, '.env'),
    ]
    for p in candidates:
        envd = _read_env_file(p)
        sid = envd.get('GOOGLE_SHEETS_SPREADSHEET_ID')
        if sid:
            return sid.strip()

    # 3) Fallback: ler do .env do frontend (variável VITE_GOOGLE_SHEETS_SPREADSHEET_ID)
    frontend_dir = os.path.join(repo_root, 'frontend')
    fe_candidates = [
        os.path.join(frontend_dir, '.env.local'),
        os.path.join(frontend_dir, '.env.development'),
        os.path.join(frontend_dir, '.env'),
    ]
    for p in fe_candidates:
        envd = _read_env_file(p)
        sid = envd.get('VITE_GOOGLE_SHEETS_SPREADSHEET_ID')
        if sid:
            return sid.strip()

    # Opcional: arquivo de texto dedicado
    txt_candidates = [
        os.path.join(backend_dir, 'spreadsheet_id.txt'),
        os.path.join(repo_root, 'spreadsheet_id.txt'),
    ]
    for p in txt_candidates:
        try:
            if os.path.exists(p):
                with open(p, 'r', encoding='utf-8') as fh:
                    sid = fh.read().strip()
                    if sid:
                        return sid
        except Exception:
            pass
    return None

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
        # Primeiro, tentar variável de ambiente (recomendado em produção)
        credentials_base64 = os.environ.get("GOOGLE_SHEETS_CREDENTIALS_JSON_BASE64")
        credentials_info = None
        if credentials_base64:
            try:
                credentials_json = base64.b64decode(credentials_base64).decode("utf-8")
                print("[get_sheet] Credenciais decodificadas a partir de GOOGLE_SHEETS_CREDENTIALS_JSON_BASE64")
                credentials_info = json.loads(credentials_json)
            except Exception as e:
                print("[get_sheet] Erro ao decodificar GOOGLE_SHEETS_CREDENTIALS_JSON_BASE64:", e)

        # Fallbacks de desenvolvimento: procurar arquivos locais no diretório do backend
        if credentials_info is None:
            backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
            local_candidates = [
                os.path.join(backend_dir, 'cred_base64.txt'),
                os.path.join(backend_dir, 'cred.json'),
                os.path.join(os.path.dirname(backend_dir), 'cred_base64.txt'),
            ]
            for p in local_candidates:
                try:
                    if os.path.exists(p):
                        print(f"[get_sheet] Tentando credencial local: {p}")
                        with open(p, 'r', encoding='utf-8') as fh:
                            content = fh.read().strip()
                        if p.lower().endswith('.txt'):
                            # assumimos base64
                            try:
                                credentials_json = base64.b64decode(content).decode('utf-8')
                                credentials_info = json.loads(credentials_json)
                                print(f"[get_sheet] Credenciais carregadas de {p} (base64)")
                                break
                            except Exception:
                                # talvez seja um JSON puro dentro do .txt
                                try:
                                    credentials_info = json.loads(content)
                                    print(f"[get_sheet] Credenciais carregadas de {p} (json)")
                                    break
                                except Exception:
                                    continue
                        else:
                            # arquivo JSON
                            try:
                                credentials_info = json.loads(content)
                                print(f"[get_sheet] Credenciais carregadas de {p}")
                                break
                            except Exception:
                                continue
                except Exception as e:
                    print(f"[get_sheet] Falha ao ler {p}:", e)

        if credentials_info is None:
            print("[get_sheet] Nenhuma credencial encontrada: defina GOOGLE_SHEETS_CREDENTIALS_JSON_BASE64 ou coloque cred_base64.txt/cred.json em backend/")
            raise Exception("Variável GOOGLE_SHEETS_CREDENTIALS_JSON_BASE64 não encontrada e nenhum arquivo de credencial local disponível")

        scopes = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive",
        ]

        credentials = Credentials.from_service_account_info(credentials_info, scopes=scopes)
        print("[get_sheet] Credenciais carregadas para o Google")
        client = gspread.authorize(credentials)
        print("[get_sheet] Cliente gspread autorizado")

        # ID da planilha deve estar em variável de ambiente em produção
        spreadsheet_id = _get_spreadsheet_id_fallback()
        if not spreadsheet_id:
            print("[get_sheet] ID da planilha não encontrado. Defina GOOGLE_SHEETS_SPREADSHEET_ID no ambiente ou adicione em frontend/.env (VITE_GOOGLE_SHEETS_SPREADSHEET_ID) ou backend/spreadsheet_id.txt.")
            raise Exception("ID da planilha (GOOGLE_SHEETS_SPREADSHEET_ID) não encontrado")

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
