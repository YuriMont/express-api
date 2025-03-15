const express = require('express');
const dotenv = require('dotenv');

const app = express();
const port = process.env.PORT || 3000;

// Middleware para processar JSON
app.use(express.json());

// Rota principal
app.get('/', (req, res) => {
    res.send('Hello, Express!');
});

// Rota de exemplo
app.get('/api/data', (req, res) => {
    res.json({ message: 'Dados de exemplo', status: 'success' });
});

// Inicializando o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
