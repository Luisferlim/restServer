// Import das bibliotecas
const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;  

app.use(express.json());

// CRUD

// Vamos simular um banco de dados local para armazenar receitas favoritas (RAM)
let favoriteRecipes = [];
let nextId = 1;

// CREATE (Adiciona uma receita favorita)
// Este endpoint primeiro consulta a API TheMealDB para obter os dados da receita.
// Endpoint: POST /api/favorites

app.post('/api/favorites', async (req, res) => {
    const { mealName } = req.body;
    
    if (!mealName) {
        return res.status(400).json({ message: "O campo 'mealName' eh obrigatório no corpo req." });
    }

    try {
        // 1. Consome a API externa para buscar a receita pelo nome
        const resposta = await axios.get(`https://www.themealdb.com/api/json/v1/1/search.php?s=${mealName}`);
        const meal = resposta.data.meals ? resposta.data.meals[0] : null;

        if (!meal) {
            return res.status(404).json({ message: `Receita nao encontrada na TheMealDB: ${mealName}` });
        }

        // 2. Cria o novo objeto favorito, simplificando os dados
        const newFavorite = {
            id: nextId++,
            externalId: meal.idMeal,
            name: meal.strMeal,
            category: meal.strCategory,
            instructions: meal.strInstructions.substring(0, 100) + '...', // Pega soh o inicio das instrucoes
            dateAdded: new Date().toISOString()
        };

        // 3. Adiciona ao nosso BD
        favoriteRecipes.push(newFavorite);

        // 4. Envia a resposta de sucesso
        res.status(201).json(newFavorite);
    } catch (error) {
        console.error("Erro ao adicionar favorito:", error.message);
        res.status(500).json({ message: "Erro ao buscar dados da TheMealDB ou adicionar favorito." });
    }
});

// READ  - Le/Lista todas as receitas favoritas
// Endpoint: GET /api/favorites
app.get('/api/favorites', (req, res) => {
    // Retorna a lista completa de receitas favoritas
    res.json(favoriteRecipes);
});

// UPDATE (Atualiza o nome de uma receita favorita)
// Endpoint: PUT /api/favorites/:id
app.put('/api/favorites/:id', (req, res) => {
    const favoriteId = parseInt(req.params.id);
    const { newName } = req.body;

    if (!newName) {
         return res.status(400).json({ message: "O campo 'newName' é obrigatório para atualização." });
    }

    const favoriteIndex = favoriteRecipes.findIndex(f => f.id === favoriteId);

    if (favoriteIndex === -1) {
        return res.status(404).json({ message: "Receita favorita não encontrada." });
    }

    // Atualiza apenas o campo 'name' no nosso registro local
    favoriteRecipes[favoriteIndex].name = newName;

    res.json(favoriteRecipes[favoriteIndex]);
});

// DELETE (Deleta uma receita favorita)
// Endpoint: DELETE /api/favorites/:id
app.delete('/api/favorites/:id', (req, res) => {
    const favoriteId = parseInt(req.params.id);
    const initialLength = favoriteRecipes.length;

    // Filtra a lista, removendo o favorito com o ID especificado
    favoriteRecipes = favoriteRecipes.filter(f => f.id !== favoriteId);

    if (favoriteRecipes.length === initialLength) {
        return res.status(404).json({ message: "Receita favorita não encontrada para exclusão." });
    }

    // Retorna uma resposta vazia com código 204 (No Content) para indicar sucesso na exclusao
    res.status(204).send();
});

// --- 2. Funcionalidade Extra: Cruzamento de Dados (Sugestão de Bebidas) ---

// Este endpoint pega uma receita aleatoria da TheMealDB e sugere uma bebida/cocktail da API TheCocktailDB (cruzamento de APIs)
// Endpoint: GET /api/pairing/suggestion



app.get('/api/pairing/suggestion', async (req, res) => {
    try {
        //  Pega uma receita aleatoria da TheMealDB
        const mealResponse = await axios.get('https://www.themealdb.com/api/json/v1/1/random.php');
        const meal = mealResponse.data.meals[0];

        // Pega uma bebida aleatoria da TheCocktailDB
        const cocktailResponse = await axios.get('https://www.thecocktaildb.com/api/json/v1/1/random.php');
        const drink = cocktailResponse.data.drinks[0];

        // Combina as informaçoes
        const suggestion = {
            mainCourse: {
                name: meal.strMeal,
                category: meal.strCategory,
                area: meal.strArea,
                instructions: meal.strInstructions.substring(0, 150) + '...',
            },
            suggestedDrink: {
                name: drink.strDrink,
                type: drink.strAlcoholic,
                ingredients: [drink.strIngredient1, drink.strIngredient2].filter(i => i) // Pega os 2 primeiros ingredientes ;;
            },
            message: `Para o prato "${meal.strMeal}", sugerimos o cocktail "${drink.strDrink}".`
        };

        res.status(200).json(suggestion);

    } catch (error) {
        console.error("Erro no cruzamento:", error.message);
        res.status(500).json({ message: "Erro ao buscar dados das APIs de Receitas e Cocktails." });
    }
});


// Inicia o servidor na porta definida
app.listen(port, () => {
    console.log(`http://localhost:${port}`);
});