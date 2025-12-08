// Import das bibliotecas
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const xml2js = require('xml2js');
const protobuf = require('protobufjs')

const app = express();
const port = 3000;  

app.use(express.json());
app.use(cors());

// Protocol Buffer

let ListaReceitasProto;

protobuf.load("receitas.proto", function(err, root) {
    if (err) throw err;
    ListaReceitasProto = root.lookupType("receitas.ListaReceitas");
});

// CRUD

// banco de dados local
let favoriteRecipes = [];
let nextId = 1;
const builder = new xml2js.Builder({ rootName: 'recipe' }); // só para ajudar a converter o Json em XML

// CREATE (Adiciona uma receita favorita)
// Este endpoint primeiro consulta a API TheMealDB para obter os dados da receita.

// Endpoint: POST /api/favorites

app.post('/api/favorites', async (req, res) => {
    const { mealName } = req.body;
    const format = req.query.format;
    
    if (!mealName) {
        return res.status(400).json({ message: "O campo 'mealName' eh obrigatório no corpo req." });
    }

    try {
        // Consome a API externa para buscar a receita pelo nome
        const resposta = await axios.get(`https://www.themealdb.com/api/json/v1/1/search.php?s=${mealName}`);
        const meal = resposta.data.meals ? resposta.data.meals[0] : null;

        if (!meal) {
            return res.status(404).json({ message: `Receita nao encontrada na TheMealDB: ${mealName}` });
        }

        const duplicada = favoriteRecipes.find(r => r.externalId === meal.idMeal);
        if (duplicada) {
            const errorMsg = { message: `A receita '${meal.strMeal}' já está na sua lista!` };
            
            if (format === 'xml') {
                res.type('application/xml');
                return res.status(409).send(new xml2js.Builder({ rootName: 'error' }).buildObject(errorMsg));
            }
            return res.status(409).json(errorMsg);
        }

        // Cria o novo objeto favorito, simplificando os dados
        const newFavorite = {
            id: nextId++,
            externalId: meal.idMeal,
            name: meal.strMeal,
            category: meal.strCategory,
            instructions: meal.strInstructions.substring(0, 100) + '...', // Pega soh o inicio das instrucoes
            dateAdded: new Date().toISOString()
        };

        // Adiciona ao BD
        favoriteRecipes.push(newFavorite);

        if (format === 'xml') {
            res.header('Content-Type', 'application/xml');
            return res.status(201).send(builder.buildObject(newFavorite));
        }

        // Envia a resposta de sucesso
        res.status(201).json(newFavorite);
    } catch (error) {
        console.error("Erro ao adicionar favorito:", error.message);
        res.status(500).json({ message: "Erro ao buscar dados da TheMealDB ou adicionar favorito." });
    }
});

// Endpoint: GET /api/favorites
// 2. READ (Lista Todos) 
app.get('/api/favorites', (req, res) => {
    const format = req.query.format;

    // Protobuf
    if (format === 'proto') {
        if (!ListaReceitasProto) return res.status(500).send("Protobuf erro.");
        const payload = { receitas: favoriteRecipes };
        
        const errMsg = ListaReceitasProto.verify(payload);
        if (errMsg) return res.status(500).send(errMsg);

        const message = ListaReceitasProto.create(payload);
        const buffer = ListaReceitasProto.encode(message).finish();

        res.set('Content-Type', 'application/x-protobuf');
        return res.send(buffer);
    }

    // XML
    if (format === 'xml') {
        res.header('Content-Type', 'application/xml');
        const xmlBuilder = new xml2js.Builder({ rootName: 'favorites' });
        const xmlObj = { recipe: favoriteRecipes };
        return res.send(xmlBuilder.buildObject(xmlObj));
    }

    // Json
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

    favoriteRecipes[favoriteIndex].name = newName;

    res.json(favoriteRecipes[favoriteIndex]);
});

// DELETE (Deleta uma receita favorita)
// Endpoint: DELETE /api/favorites/:id
app.delete('/api/favorites/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const format = req.query.format;
    const initialLen = favoriteRecipes.length;

    favoriteRecipes = favoriteRecipes.filter(f => f.id !== id);

    if (favoriteRecipes.length === initialLen) {
        const errorMsg = { message: "Receita não encontrada para exclusão." };
        if (format === 'xml') {
            res.type('application/xml');
            return res.status(404).send(new xml2js.Builder({ rootName: 'error' }).buildObject(errorMsg));
        }
        return res.status(404).json(errorMsg);
    }

    res.status(204).send();
});

// Funcionalidade Extra

// Este endpoint pega uma receita aleatoria da sua lista de favoritos e sugere uma bebida/cocktail da API TheCocktailDB (cruzamento de APIs)
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
    console.log(`http://localhost:${port}/api/favorites`);
});