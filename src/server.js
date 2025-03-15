app.get('/auth/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) {
        return res.status(400).json({ error: 'Código de autorização ausente' });
    }

    try {
        const codeVerifier = cache['code_verifier']; // Recupera o code_verifier salvo
        if (!codeVerifier) {
            return res.status(400).json({ error: 'Code Verifier não encontrado' });
        }

        const response = await axios.post('https://api.mercadopago.com/oauth/token',
            qs.stringify({
                grant_type: 'authorization_code',
                client_id: process.env.MP_CLIENT_ID,
                client_secret: process.env.MP_CLIENT_SECRET,
                code,
                redirect_uri: process.env.MP_REDIRECT_URI,
                code_verifier: codeVerifier, // Enviando o PKCE correto
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        // Salvar o token no JSON
        fs.writeFileSync('tokens.json', JSON.stringify(response.data, null, 2));

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Falha ao obter o token', details: error.response?.data || error.message });
    }
});
