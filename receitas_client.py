import requests
import sys
import time

try:
    import receitas_pb2
except ImportError:
    print("O arquivo 'receitas_pb2.py' não foi encontrado.")
    print("Execute: python -m grpc_tools.protoc -I. --python_out=. receitas.proto")
    sys.exit(1)

BASE_URL = "http://localhost:3000/api"

def listar_receitas():
    try:
        response = requests.get(f"{BASE_URL}/favorites?format=proto")
        
        if response.status_code == 200:
            tamanho = len(response.content)
            print(f"Payload recebido: {tamanho} bytes")
            
            lista = receitas_pb2.ListaReceitas()
            lista.ParseFromString(response.content)
            
            if len(lista.receitas) == 0:
                print("A lista está vazia.")
            else:
                print(f"{len(lista.receitas)} receitas encontradas:")
                print(f"{'ID':<5} | {'NOME':<30} | {'CATEGORIA'}")
                for r in lista.receitas:
                    print(f"{r.id:<5} | {r.name[:30]:<30} | {r.category}")
        else:
            print(f"Erro: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"Erro de conexão: {e}")

def adicionar_receita():
    nome = input("Digite o nome da receita (ex: Pizza, Sushi): ")
    if not nome: return

    try:
        payload = {"mealName": nome}
        response = requests.post(f"{BASE_URL}/favorites", json=payload)
        
        if response.status_code == 201:
            dados = response.json()
            print(f"Receita '{dados['name']}' adicionada com ID {dados['id']}.")
        elif response.status_code == 409:
            print("409: Essa receita já existe na sua lista!")
        elif response.status_code == 404:
            print("404: Receita não encontrada na base de dados externa.")
        else:
            print(f"Erro: {response.status_code}")
            
    except Exception as e:
        print(f"Erro: {e}")

def deletar_receita():
    try:
        id_del = input("Digite o ID da receita para excluir: ")
        if not id_del: return

        response = requests.delete(f"{BASE_URL}/favorites/{id_del}")

        if response.status_code == 204:
            print("Receita excluída com sucesso!")
        elif response.status_code == 404:
            print("404: ID não encontrado na lista.")
        else:
            print(f"Erro: {response.status_code}")
    except Exception as e:
        print(f"Erro: {e}")

def harmonizar():
    try:
        response = requests.get(f"{BASE_URL}/pairing/suggestion")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n{data['message']}")
            print(f"Prato: {data['mainCourse']['name']}")
            print(f"Bebida: {data['suggestedDrink']['name']} ({data['suggestedDrink']['type']})")
        elif response.status_code == 500:
            print("500: Erro de comunicação com a API")
        else:
            print("Erro ao buscar harmonização.")
    except Exception as e:
        print(f"Erro: {e}")

def menu():
    while True:
        print("Gerenciador de Receitas")
        print("1. Listar Favoritos")
        print("2. Adicionar Receita")
        print("3. Deletar Receita")
        print("4. Sugestão de Harmonização")
        print("0. Sair")
        
        opcao = input("\nEscolha uma opção: ")
        
        print("\n")
        if opcao == '1':
            listar_receitas()
        elif opcao == '2':
            adicionar_receita()
        elif opcao == '3':
            deletar_receita()
        elif opcao == '4':
            harmonizar()
        elif opcao == '0':
            break
        else:
            print("Opção inválida!")
        
        input("\nPressione ENTER para continuar...")

if __name__ == "__main__":
    menu()