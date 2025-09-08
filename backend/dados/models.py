from django.db import models
from django.conf import settings


class EmailVerificationStatus(models.Model):
	"""Rastreia o último envio de e-mail de verificação para um usuário."""
	user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='email_verification_status')
	last_sent_at = models.DateTimeField(null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		verbose_name = 'Status de Verificação por E-mail'
		verbose_name_plural = 'Status de Verificação por E-mail'

	def __str__(self):
		return f"EmailVerificationStatus(user={self.user_id}, last_sent_at={self.last_sent_at})"
