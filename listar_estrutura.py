# salvar como listar_estrutura.py e rodar com: python listar_estrutura.py
import os

def listar(diretorio, prefixo=''):
    for nome in sorted(os.listdir(diretorio)):
        caminho = os.path.join(diretorio, nome)
        if os.path.isdir(caminho):
            print(f"{prefixo} {nome}/")
            listar(caminho, prefixo + '    ')
        else:
            print(f"{prefixo} {nome}")

listar('.')
