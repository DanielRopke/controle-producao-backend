from django.contrib import admin
from .models import MatrizRow


@admin.register(MatrizRow)
class MatrizRowAdmin(admin.ModelAdmin):
	list_display = ('pep', 'seccional', 'status_sap', 'tipo', 'mes', 'valor')
	search_fields = ('pep', 'seccional', 'status_sap', 'tipo')
	list_filter = ('seccional', 'status_sap', 'tipo', 'mes')
