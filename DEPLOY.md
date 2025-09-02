# Deploy rápido (Render + GitHub)

## Backend (Django)
- Render: Web Service
- Build Command:
  - `pip install -r backend/requirements.txt`
  - `python backend/manage.py collectstatic --noinput`
  - `python backend/manage.py migrate --noinput`
- Start Command: `gunicorn backend_project.wsgi:application --chdir backend --log-file -`
- Env:
  - `DJANGO_SECRET_KEY` (gerada)
  - `DJANGO_DEBUG=False`
  - `ALLOWED_HOSTS=.onrender.com,localhost,127.0.0.1,controlesetup.com.br,www.controlesetup.com.br`
  - `FRONTEND_ORIGINS=https://controle-producao-frontend.onrender.com,https://www.controlesetup.com.br`

## Frontend (Vite)
- Render: Static Site
- Build Command:
  - `cd frontend && npm ci && npm run build`
- Publish Directory: `frontend/dist`
- Env:
  - `VITE_API_BASE=https://controle-producao-backend.onrender.com/api`

## GitHub
1. Confirme `.gitignore` e faça commit.
2. Push para o GitHub (main).
3. Conecte o repo no Render e importe o `render.yaml` (Blueprint).

## Local
- Backend: `cd backend && pip install -r requirements.txt && python manage.py runserver`
- Frontend: `cd frontend && npm i && npm run dev`
