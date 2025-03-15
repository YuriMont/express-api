const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const qs = require('qs');
const fs = require('fs');

// Carregar variáveis de ambiente
dotenv.config();

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

// Rota para iniciar OAuth 2.0 com Mercado Pago
app.get('/auth', (req, res) => {
    const authUrl = `https://auth.mercadopago.com/authorization?response_type=code&client_id=${process.env.MP_CLIENT_ID}&redirect_uri=${process.env.MP_REDIRECT_URI}`;
    res.redirect(authUrl);
});

// Rota de callback para receber o código de autorização
app.get('/auth/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) {
        return res.status(400).json({ error: 'Código de autorização ausente' });
    }

    try {
        const response = await axios.post('https://api.mercadopago.com/oauth/token',
            qs.stringify({
                grant_type: 'authorization_code',
                client_id: process.env.MP_CLIENT_ID,
                client_secret: process.env.MP_CLIENT_SECRET,
                code,
                redirect_uri: process.env.MP_REDIRECT_URI
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        // Salvar o token no arquivo JSON
        fs.writeFileSync('res.json', JSON.stringify(response.data, null, 2));

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Falha ao obter o token', details: error.response?.data || error.message });
    }
});

const getToken = () => {
    try {
        const data = fs.readFileSync('tokens.json', 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return null;
    }
};

// Exemplo de uso
app.get('/api/token', (req, res) => {
    const tokenData = getToken();
    if (!tokenData) {
        return res.status(404).json({ error: 'Nenhum token encontrado' });
    }
    res.json(tokenData);
});

// Inicializando o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
