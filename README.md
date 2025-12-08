# Servidor REST de Receitas — Documentação

Este servidor REST foi desenvolvido em Node.js + Express e integra APIs externas de culinária para criar, listar, atualizar e excluir receitas favoritas em memória.  
Além disso, inclui uma funcionalidade extra de sugestão automática combinando um prato aleatório com uma bebida aleatória.

## Tecnologias utilizadas
- Node.js  
- Express  
- Axios  
- Cors
- Xml2js
- Protobufjs
- APIs externas:
  - TheMealDB  
  - TheCocktailDB  
- Clientes:
  - HTML5/JS (Cliente Web)
  - Python

# Como funciona o servidor

## Banco de dados (simulado)
O servidor utiliza um banco de dados em memória, implementado com um array simples:

```js
let favoriteRecipes = [];
let nextId = 1;
```

# Documentação da API

A documentação completa no padrão OpenAPI 3.1 está disponível no arquivo `swagger.yaml`.
Os dados são apagados sempre que o servidor reinicia.

## Endpoints

## 1) Adicionar uma receita favorita

### `POST /api/favorites`

Este endpoint consulta automaticamente a API TheMealDB usando o nome da receita enviado no corpo da requisição.
Após obter os dados externos, salva uma versão simplificada da receita no "banco de dados" local.

### Corpo esperado:

```json
{
  "mealName": "Arrabiata"
}
```

### Funcionamento:

1. Busca a receita na TheMealDB.
2. Se encontrada, cria um objeto contendo:

   * id interno
   * externalId da API original
   * nome
   * categoria
   * instruções resumidas
   * data de inclusão
3. Armazena no array `favoriteRecipes`.
4. Retorna o objeto criado com status 201.

## 2) Listar todas as receitas favoritas

### `GET /api/favorites`

Retorna a lista completa de receitas favoritas armazenadas em memória.

### Exemplo de resposta:

```json
[
  {
    "id": 1,
    "externalId": "52771",
    "name": "Spicy Arrabiata Penne",
    "category": "Vegetarian",
    "instructions": "Bring a large pot of water...",
    "dateAdded": "2025-01-15T14:12:33.123Z"
  }
]
```

## 3) Atualizar o nome de uma receita favorita

### `PUT /api/favorites/:id`

Permite atualizar somente o campo `name` de uma receita favorita já cadastrada.

### Corpo esperado:

```json
{
  "newName": "Nome atualizado"
}
```

* Retorna 404 se o ID não existir.
* Retorna o objeto atualizado em caso de sucesso.

## 4) Excluir uma receita favorita

### `DELETE /api/favorites/:id`

Remove uma receita favorita pelo ID especificado.

* Retorna 404 caso o ID não exista.
* Retorna status 204 (No Content) em caso de exclusão bem-sucedida.

## 5) Sugestão de prato + bebida

### `GET /api/pairing/suggestion`

Este endpoint cruza dados entre duas APIs externas:

1. Obtém um prato da sua lista favorita de receitas.
2. Obtém uma bebida aleatória da API TheCocktailDB.
3. Retorna uma sugestão contendo:

   * informações do prato
   * informações da bebida
   * ingredientes principais
   * instruções resumidas
   * mensagem de recomendação

### Exemplo de resposta:

```json
{
  "mainCourse": {
    "name": "Chicken Alfredo",
    "category": "Pasta",
    "area": "Italian",
    "instructions": "Cook the pasta in salted water..."
  },
  "suggestedDrink": {
    "name": "Margarita",
    "type": "Alcoholic",
    "ingredients": ["Tequila", "Triple Sec"]
  },
  "message": "Para o prato \"Chicken Alfredo\", sugerimos o cocktail \"Margarita\"."
}
```

# Como executar

### 1. Pré-requisitos
* Node.js instalado.
* Python instalado.

### 2. Instalação e Execução do Servidor
```bash
npm install
node servidor.js
```

O servidor será iniciado em:

```
http://localhost:3000
```

# Clientes

## 1. Cliente Web (`index.html`)

### Funcionalidades
* Adicionar novas receitas (integração com TheMealDB).
* Visualizar lista de favoritos em tabela.
* Excluir receitas.
* Harmonização: Solicitar sugestão de bebida para um prato aleatório.

### Como usar
1.  Certifique-se de que o servidor está rodando (`node servidor.js`).
2.  Abra o arquivo `index.html` em qualquer navegador.
3.  **Teste sugerido:**
    * Adicione "Pizza".
    * Adicione "Sushi".
    * Tente adicionar "Pizza" novamente (Deve mostrar erro de conflito).
    * Vá na área de Harmonização e clique em "Sugerir Aleatório".

## 2. Cliente Python (`cliente_python.py`)

### Pré-requisitos
* Bibliotecas necessárias
    ```bash
    pip install requests protobuf grpcio-tools
    ```

### Compilação do Protobuf
Para que o Python entenda o formato binário, é necessário compilar o arquivo `.proto`. No terminal, execute:

```bash
python -m grpc_tools.protoc -I. --python_out=. receitas.proto
```

Isso gerará o arquivo receitas_pb2.py, que é importado pelo script cliente.

### Como usar

```bash
python receitas_client.py
```
O script fará uma requisição GET /api/favorites?format=proto. No console, você verá:

1. O tamanho do payload em bytes (geralmente muito menor que JSON/XML).

2. Os dados decodificados do binário para texto legível.