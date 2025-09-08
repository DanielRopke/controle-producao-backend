from django.db import models
from django.conf import settings


class EmailVerificationStatus(models.Model):
	"""Rastreia o último envio de e-mail de verificação por usuário."""
	user = models.OneToOneField(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name='verification_status'
	)
	last_sent_at = models.DateTimeField(null=True, blank=True)

	def __str__(self) -> str:
		return f"EmailVerificationStatus(user={self.user_id}, last_sent_at={self.last_sent_at})"

