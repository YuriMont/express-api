const express = require("express");
const session = require('express-session'); 
const dotenv = require("dotenv");
const axios = require("axios");
const qs = require("qs");
const fs = require("fs");
const crypto = require("crypto");

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const CLIENT_ID = process.env.MP_CLIENT_ID;
const CLIENT_SECRET = process.env.MP_CLIENT_SECRET;
const REDIRECT_URI = process.env.MP_REDIRECT_URI;

const generatePKCE = () => {
  const codeVerifier = crypto.randomBytes(32).toString("base64url"); // Gerar code_verifier
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, ""); // Gerar code_challenge

  return { codeVerifier, codeChallenge };
};

// Middleware para processar JSON
app.use(express.json());

app.use(session({
  secret: process.env.SECERET, // Use uma string segura para produção
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // true apenas se usar HTTPS
}));

// Rota principal
app.get("/", (req, res) => {
  res.send("Hello, Express!");
});

// Rota de exemplo
app.get("/api/data", (req, res) => {
  res.json({ message: "Dados de exemplo", status: "success" });
});

// Rota para iniciar OAuth 2.0 com Mercado Pago
app.get("/auth", (req, res) => {
  const { codeVerifier, codeChallenge } = generatePKCE();

  // Armazenar o code_verifier para usá-lo depois na troca de token
  req.session.codeVerifier = codeVerifier; // Pode ser armazenado em sessão ou banco de dados

  // Gerar a URL de autorização com os parâmetros necessários
  const authUrl = `https://auth.mercadopago.com/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  res.redirect(authUrl);
});

// Rota de callback para receber o código de autorização
app.get("/auth/callback", async (req, res) => {
  const authorizationCode = req.query.code;

  const codeVerifier = req.session.codeVerifier;

  if (!authorizationCode || !codeVerifier) {
    return res.status(400).send('Código de autorização ou code_verifier não encontrado');
  }

  try {
    // Trocar o código de autorização pelo access token
    const response = await axios.post(
      'https://api.mercadopago.com/oauth/token',
      qs.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'refresh_token',
        code: authorizationCode,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,  // Usar o code_verifier aqui
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // Salvar o token no arquivo JSON
    fs.writeFileSync("res.json", JSON.stringify(response.data, null, 2));

    res.json(response.data);
  } catch (error) {
    res
      .status(500)
      .json({
        error: "Falha ao obter o token",
        details: error.response?.data || error.message,
      });
  }
});

const getToken = () => {
  try {
    const data = fs.readFileSync("res.json", "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
};

// Exemplo de uso
app.get("/api/token", (req, res) => {
  const tokenData = getToken();
  if (!tokenData) {
    return res.status(404).json({ error: "Nenhum token encontrado" });
  }
  res.json(tokenData);
});

// Inicializando o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
