from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):
    dependencies = [
        ('dados', '0002_delete_matrizrow'),
    ]

    operations = [
        migrations.CreateModel(
            name='EmailVerificationStatus',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('last_sent_at', models.DateTimeField(blank=True, null=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='verification_status', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
