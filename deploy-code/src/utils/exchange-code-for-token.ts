const axios = require('axios');
import dotenv from "dotenv"
dotenv.config();
export async function exchangeCodeForToken(code:string) {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    console.log(process.env.GITHUB_ACCESS_TOKEN_API)
    try {
        const response = await axios.post(
            "https://github.com/login/oauth/access_token",
            {
                client_id: "Iv23liiMdniBQJocktAi",
                client_secret: "da8151b7d6b6ee3712dd25df42506b011b0a753d",
                code: code,
            },
            {
                headers: {
                    Accept: 'application/json',
                },
            }
        );
        return response.data.access_token;
    } catch (error:any) {
        console.error('Error exchanging code for token:', error.response.data);
        throw new Error('Failed to exchange code for token');
    }
}
