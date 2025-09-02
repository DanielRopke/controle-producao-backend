from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "Cria ou atualiza um usuário (opcionalmente staff/superuser)."

    def add_arguments(self, parser):
        parser.add_argument("--username", required=True, help="Nome de usuário (login)")
        parser.add_argument("--password", required=True, help="Senha do usuário")
        parser.add_argument("--email", default="", help="E-mail do usuário (opcional)")
        parser.add_argument(
            "--superuser",
            action="store_true",
            help="Define o usuário como superuser (acesso total)",
        )
        parser.add_argument(
            "--staff",
            action="store_true",
            help="Define o usuário como staff (acesso ao admin)",
        )
        parser.add_argument(
            "--update",
            action="store_true",
            help="Se o usuário já existir, atualiza senha/flags ao invés de falhar",
        )

    def handle(self, *args, **options):
        User = get_user_model()
        # argparse entrega as chaves sem os prefixos '--'
        username = options["username"]
        password = options["password"]
        email = options["email"]
        make_superuser = options["superuser"]
        make_staff = options["staff"]
        allow_update = options["update"]

        try:
            user = User.objects.filter(username=username).first()
            if user:
                if not allow_update:
                    raise CommandError(
                        f"Usuário '{username}' já existe. Use --update para atualizar."
                    )
                # Atualiza senha e flags
                if password:
                    user.set_password(password)
                if email:
                    user.email = email
                user.is_superuser = bool(make_superuser)
                # Se superuser, também deve ser staff
                user.is_staff = bool(make_staff or make_superuser)
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Usuário '{username}' atualizado."))
                return

            # Criar novo usuário
            if make_superuser:
                user = User.objects.create_superuser(
                    username=username,
                    email=email or "",
                    password=password,
                )
            else:
                user = User.objects.create_user(
                    username=username,
                    email=email or "",
                    password=password,
                )
                # Se não for superuser, ainda podemos marcá-lo como staff se solicitado
                if make_staff:
                    user.is_staff = True
                    user.save(update_fields=["is_staff"])

            self.stdout.write(self.style.SUCCESS(f"Usuário '{username}' criado com sucesso."))
        except Exception as exc:
            raise CommandError(str(exc))
