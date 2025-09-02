from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = "Cria dois usuários demo para login"

    def handle(self, *args, **options):
        User = get_user_model()
        users = [
            ("usuario1", "senha123"),
            ("usuario2", "senha123"),
        ]
        for username, password in users:
            if not User.objects.filter(username=username).exists():
                User.objects.create_user(username=username, password=password)
                self.stdout.write(self.style.SUCCESS(f"Criado usuário: {username} / {password}"))
            else:
                self.stdout.write(self.style.WARNING(f"Usuário já existe: {username}"))
        self.stdout.write(self.style.SUCCESS("Pronto."))
