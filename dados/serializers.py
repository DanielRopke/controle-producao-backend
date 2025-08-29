from rest_framework import serializers


class MatrizItemSerializer(serializers.Serializer):
    """Contrato de saída do endpoint /api/matriz-dados/"""
    pep = serializers.CharField()
    prazo = serializers.CharField(allow_blank=True, required=False)
    dataConclusao = serializers.CharField(allow_blank=True, required=False)
    mes = serializers.CharField(allow_blank=True, required=False)
    statusSap = serializers.CharField(allow_blank=True, required=False)
    valor = serializers.FloatField(required=False)
    seccional = serializers.CharField(allow_blank=True, required=False)
    tipo = serializers.CharField(allow_blank=True, required=False)
    statusEner = serializers.CharField(allow_blank=True, required=False)
    statusConc = serializers.CharField(allow_blank=True, required=False)
    statusServico = serializers.CharField(allow_blank=True, required=False)
