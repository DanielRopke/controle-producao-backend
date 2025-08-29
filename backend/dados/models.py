from django.db import models


class MatrizRow(models.Model):
	"""
	Linha normalizada da Matriz (Prazos SAP) para alimentar o frontend.
	"""
	pep = models.CharField(max_length=64, db_index=True)
	prazo = models.CharField(max_length=255, blank=True, null=True)
	data_conclusao = models.DateField(blank=True, null=True, db_index=True)
	mes = models.CharField(max_length=7, blank=True, null=True, db_index=True)  # YYYY-MM
	status_sap = models.CharField(max_length=128, blank=True, null=True, db_index=True)
	valor = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True)
	seccional = models.CharField(max_length=128, blank=True, null=True, db_index=True)
	tipo = models.CharField(max_length=128, blank=True, null=True, db_index=True)
	status_ener = models.CharField(max_length=128, blank=True, null=True)
	status_conc = models.CharField(max_length=128, blank=True, null=True)
	status_servico = models.CharField(max_length=128, blank=True, null=True)

	fonte = models.CharField(max_length=64, default='sheets')  # rastreabilidade
	criado_em = models.DateTimeField(auto_now_add=True)
	atualizado_em = models.DateTimeField(auto_now=True)

	class Meta:
		indexes = [
			models.Index(fields=['seccional']),
			models.Index(fields=['status_sap']),
			models.Index(fields=['tipo']),
			models.Index(fields=['mes']),
		]
		verbose_name = 'Matriz - Linha'
		verbose_name_plural = 'Matriz - Linhas'

	def __str__(self):
		return f"{self.pep} | {self.seccional} | {self.status_sap}"
