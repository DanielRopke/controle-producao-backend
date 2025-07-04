import os

def listar(diretorio, prefixo=''):
    for nome in sorted(os.listdir(diretorio)):
        caminho = os.path.join(diretorio, nome)
        if os.path.isdir(caminho):
            print(f"{prefixo}{nome}/")
            listar(caminho, prefixo + '    ')
        else:
            print(f"{prefixo}{nome}")

# Alterar para a pasta que deseja listar, exemplo:
listar('C:/Users/DANIEL/controle-producao')
