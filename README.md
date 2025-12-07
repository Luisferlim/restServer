# Servidor REST de Receitas — Documentação

Este servidor REST foi desenvolvido em Node.js + Express e integra APIs externas de culinária para criar, listar, atualizar e excluir receitas favoritas em memória.  
Além disso, inclui uma funcionalidade extra de sugestão automática combinando um prato aleatório com uma bebida aleatória.

---

## Tecnologias utilizadas
- Node.js  
- Express  
- Axios  
- APIs externas:
  - TheMealDB  
  - TheCocktailDB  

---

# Como funciona o servidor

## Banco de dados (simulado)
O servidor utiliza um banco de dados em memória, implementado com um array simples:

```js
let favoriteRecipes = [];
let nextId = 1;
````

Os dados são apagados sempre que o servidor reinicia.

---

# Endpoints da API

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

---

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

---

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

---

## 4) Excluir uma receita favorita

### `DELETE /api/favorites/:id`

Remove uma receita favorita pelo ID especificado.

* Retorna 404 caso o ID não exista.
* Retorna status 204 (No Content) em caso de exclusão bem-sucedida.

---

# Funcionalidade Extra

## 5) Sugestão automática de prato + bebida

### `GET /api/pairing/suggestion`

Este endpoint cruza dados entre duas APIs externas:

1. Obtém um prato aleatório da API TheMealDB.
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

---

# Como executar

```bash
npm install
node server.js
```

O servidor será iniciado em:

```
http://localhost:3000
```

```
