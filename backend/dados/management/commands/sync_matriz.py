import sys
from django.core.management.base import BaseCommand
from django.db import transaction
from dateutil.parser import parse
from dados.google_sheets import get_sheet
from dados.models import MatrizRow
from decimal import Decimal, InvalidOperation


def _parse_currency_to_decimal(valor_raw):
    if valor_raw is None:
        return Decimal('0')
    s = str(valor_raw).strip()
    if not s:
        return Decimal('0')
    s = s.replace('R$', '').replace(' ', '').replace('.', '').replace('\u00A0', '')
    s = s.replace(',', '.')
    try:
        return Decimal(s)
    except (InvalidOperation, ValueError):
        return Decimal('0')


class Command(BaseCommand):
    help = 'Sincroniza dados da aba "Prazos SAP" do Google Sheets para a tabela MatrizRow.'

    def add_arguments(self, parser):
        parser.add_argument('--truncate', action='store_true', help='Limpa a tabela antes de importar')

    def handle(self, *args, **options):
        sheet_name = 'Prazos SAP'
        self.stdout.write(self.style.NOTICE(f'Lendo planilha: {sheet_name}'))
        data = get_sheet(sheet_name)
        self.stdout.write(self.style.SUCCESS(f'Linhas lidas: {len(data)}'))

        if options.get('truncate'):
            self.stdout.write('Apagando registros existentes...')
            MatrizRow.objects.all().delete()

        created = 0
        updated = 0
        with transaction.atomic():
            for row in data:
                # Helper para extrair e normalizar como string
                def S(*keys):
                    for k in keys:
                        if k in row and row[k] is not None:
                            return str(row[k]).strip()
                    return ''

                seccional = S('SECCIONAL', 'SECCIONAL\nOBRA')
                status_sap = S('STATUS SAP', 'Status SAP')
                tipo = S('TIPO')
                data_conclusao_raw = S('DATA CONCLUSÃO', 'Data Conclusão')
                status_ener = S('Status ENER', 'STATUS ENER')
                status_conc = S('Status CONC', 'STATUS CONC')
                status_servico = S('status serviço', 'STATUS SERVIÇO', 'Status Serviço')
                pep = S('PEP')
                prazo = S('PRAZO', 'Prazo')
                valor_raw = row.get('R$') or row.get('RS') or row.get('VALOR') or row.get('Valor')
                valor = _parse_currency_to_decimal(valor_raw)

                if not pep:
                    continue

                data_conclusao = None
                mes = None
                if data_conclusao_raw:
                    try:
                        dt = parse(data_conclusao_raw, dayfirst=True)
                        data_conclusao = dt.date()
                        mes = dt.strftime('%Y-%m')
                    except Exception:
                        pass

                obj, created_flag = MatrizRow.objects.update_or_create(
                    pep=pep,
                    defaults=dict(
                        prazo=prazo or None,
                        data_conclusao=data_conclusao,
                        mes=mes,
                        status_sap=status_sap or None,
                        valor=valor,
                        seccional=seccional or None,
                        tipo=tipo or None,
                        status_ener=status_ener or None,
                        status_conc=status_conc or None,
                        status_servico=status_servico or None,
                        fonte='sheets',
                    )
                )
                if created_flag:
                    created += 1
                else:
                    updated += 1

        self.stdout.write(self.style.SUCCESS(f'Importação concluída. Criados: {created}, Atualizados: {updated}'))
        self.stdout.write(self.style.SUCCESS('Para usar o banco no endpoint, defina USE_DB_FOR_MATRIX=true no ambiente.'))
