from dados.google_sheets import get_sheet

if __name__ == "__main__":
    try:
        dados = get_sheet('importCarteiraObra')
        print(f"Sucesso! {len(dados)} linhas carregadas.")
    except Exception as e:
        print(f"Erro: {e}")
