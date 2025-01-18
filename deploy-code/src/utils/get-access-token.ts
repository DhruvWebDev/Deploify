import axios from "axios"
import dotenv from "dotenv"
dotenv.config();
async function getAccessToken(code) {
  const response = await axios.post(
    process.env.GITHUB_ACCESS_TOKEN_API as string,
    {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    },
    { headers: { Accept: "application/json" } }
  );

  return response.data.access_token;
}
