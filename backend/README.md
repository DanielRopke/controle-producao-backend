# Backend (Django)

Este backend expõe os endpoints consumidos pela página PrazosSAP.

## Variáveis de ambiente (.env na raiz do monorepo)

- DJANGO_SECRET_KEY=troque-essa-chave
- DJANGO_DEBUG=True
- GOOGLE_SHEETS_CREDENTIALS_JSON_BASE64=... (JSON da Service Account em base64)
- GOOGLE_SHEETS_SPREADSHEET_ID=... (ID da planilha)
- DATABASE_URL=postgres://... (opcional; Render)
- USE_DB_FOR_MATRIX=true (para o endpoint /api/matriz-dados/ ler do banco)

## Setup local

1. Instale dependências:
   - `pip install -r backend/requirements.txt`
2. Migre o banco:
   - `python backend/manage.py migrate`
3. (Opcional) Sincronize a planilha para o banco:
   - `python backend/manage.py sync_matriz --truncate`
4. Suba o servidor:
   - `python backend/manage.py runserver 0.0.0.0:8000`

## Endpoints

- GET `/api/exemplo/`
- GET `/api/seccionais/`
- GET `/api/status-sap-unicos/`
- GET `/api/tipos-unicos/`
- GET `/api/meses-conclusao/`
- GET `/api/matriz-dados/` (suporta filtros: `seccional`, `status_sap`, `tipo`, `mes`, `data_inicio`, `data_fim`)

Resposta de `/api/matriz-dados/` (exemplo):

```
{
  "pep": "RS-2301112UNR1.2.0200",
  "prazo": "231",
  "dataConclusao": "10/01/2025",
  "mes": "2025-01",
  "statusSap": "LIB /ATEC",
  "valor": 330586.0,
  "seccional": "Sul",
  "tipo": "QLP",
  "statusEner": "Fora do Prazo",
  "statusConc": "Fora do Prazo",
  "statusServico": "Em Fechamento"
}
```

## Deploy no Render

- Procfile já configurado: `web: gunicorn backend_project.wsgi:application --chdir backend --bind 0.0.0.0:$PORT`
- Defina as variáveis de ambiente na dashboard do Render.
- Rode `python manage.py collectstatic` no build, se desejar servir estáticos.
