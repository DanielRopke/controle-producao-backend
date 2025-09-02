from rest_framework import serializers

class MatrizItemSerializer(serializers.Serializer):
    """
    Serializer para itens da matriz de prazos SAP.
    """
    pep = serializers.CharField()
    prazo = serializers.CharField()
    dataConclusao = serializers.CharField()
    statusSap = serializers.CharField()
    valor = serializers.CharField()
    seccional = serializers.CharField()
    tipo = serializers.CharField()
