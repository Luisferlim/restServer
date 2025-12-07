// aqui coloquei as bibliotecas basicas
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());



//API qye vamos utilizar 
const FIPE_API = "https://brasilapi.com.br/api/fipe";


// CRUD
let favoritos = [];

// CREATE
app.post("/favoritos", (req, res) => {
    const novo = req.body;
    novo.id = Date.now();
    favoritos.push(novo);
    res.json({ mensagem: "Adicionado aos favoritos!", item: novo });
});

// READ
app.get("/favoritos", (req, res) => {
    res.json(favoritos);
});

// UPDATE
app.put("/favoritos/:id", (req, res) => {
    const id = Number(req.params.id);
    const dados = req.body;

    const index = favoritos.findIndex(f => f.id === id);
    if (index === -1) return res.status(404).json({ erro: "ID não encontrado" });

    favoritos[index] = { ...favoritos[index], ...dados };
    res.json({ mensagem: "atualizado", item: favoritos[index] });
});

// DELETE
app.delete("/favoritos/:id", (req, res) => {
    const id = Number(req.params.id);
    favoritos = favoritos.filter(f => f.id !== id);
    res.json({ mensagem: "Removido!" });
});


// 2. Buscar modelos via FIPE API

app.get("/fipe/marcas/:tipo", async (req, res) => {
    const { tipo } = req.params; // carros / motos / caminhoes

    try {
        const resposta = await axios.get(`${FIPE_API}/marcas/v1/${tipo}`);
        res.json(resposta.data);
    } catch (erro) {
        res.status(500).json({ erro: "Erro ao buscar marcas FIPE" });
    }
});

app.get("/fipe/modelos/:tipo/:codigoMarca", async (req, res) => {
    const { tipo, codigoMarca } = req.params;

    try {
        const resposta = await axios.get(`${FIPE_API}/modelos/v1/${tipo}/${codigoMarca}`);
        res.json(resposta.data);
    } catch (erro) {
        res.status(500).json({ erro: "Erro ao buscar modelos FIPE" });
    }
});

app.get("/fipe/valor/:tipo/:codigoMarca/:codigoModelo/:ano", async (req, res) => {
    const { tipo, codigoMarca, codigoModelo, ano } = req.params;

    try {
        const resposta = await axios.get(
            `${FIPE_API}/preco/v1/${tipo}/${codigoMarca}/${codigoModelo}/${ano}`
        );
        res.json(resposta.data);
    } catch (erro) {
        res.status(500).json({ erro: "Erro ao buscar valor FIPE" });
    }
});

// Servidor ON
app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});