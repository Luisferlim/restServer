import requests
import receitas_pb2

URL = "http://localhost:3000/api/favorites"

print("Testando Protocolo Buffer")

response = requests.get(f"{URL}?format=proto")

if response.status_code == 200:
    print(f"Bytes recebidos: {len(response.content)}")
    
    lista = receitas_pb2.ListaReceitas()
    lista.ParseFromString(response.content)
    
    print(f"Receitas encontradas: {len(lista.receitas)}")
    for r in lista.receitas:
        print(f" - {r.name} ({r.category})")
else:
    print(f"Erro: {response.status_code} - {response.text}")