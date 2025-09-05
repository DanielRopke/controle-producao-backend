web: sh -c "python backend/manage.py migrate --noinput && python backend/manage.py collectstatic --noinput && gunicorn backend_project.wsgi:application --chdir backend"
