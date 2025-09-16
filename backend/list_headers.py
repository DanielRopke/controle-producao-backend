from dados.google_sheets import get_sheet

if __name__ == "__main__":
    try:
        records = get_sheet('CarteiraObras')
        print(f"Linhas carregadas: {len(records)}")
        if records:
            headers = list(records[0].keys())
            print("Cabecalhos:")
            for h in headers:
                print(h)
        else:
            print("Nenhum registro encontrado.")
    except Exception as e:
        print(f"Erro ao ler CarteiraObras: {e}")
