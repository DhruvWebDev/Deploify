import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { spinUpContainer } from './utils/spinUpContainer';
import { exchangeCodeForToken } from './utils/exchange-code-for-token';
import { encryptToken } from './utils/encrypt-decrypt';
import cookieParser from 'cookie-parser';

const app = express();
app.use(cors({
  origin: 'http://localhost:5173', // Adjust this to match your frontend URL
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

const port = 3000;

const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');

  ws.on('message', async (message) => {
    try {
      const { type, githubUrl, env, framework } = JSON.parse(message.toString());
      console.log(`Received message => ${message}`);

      if (type === "build-project") {
        ws.send(JSON.stringify({ type: 'log', message: 'Starting deployment process...' }));
        
        try {
          const result = await spinUpContainer({ githubUrl, env, framework });
          ws.send(JSON.stringify({ 
            type: 'deployment-success', 
            message: 'Deployment completed successfully!',
            data: result 
          }));
        } catch (error) {
          ws.send(JSON.stringify({ 
            type: 'deployment-error', 
            message: 'Deployment failed: ' + error.message 
          }));
        }
      } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Unsupported message type' }));
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Internal server error' }));
    }
  });

  ws.send(JSON.stringify({ type: 'connected', message: 'Connected to WebSocket server' }));
});

app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).send('Code is missing from the query params');
  }

  try {
    const accessToken = await exchangeCodeForToken(code);
    const encryptedAccessToken = encryptToken(accessToken);
    
    res.cookie('_access_token', encryptedAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.redirect('http://localhost:5173');
  } catch (error) {
    console.error('Failed to get access token:', error);
    res.status(500).send('Failed to get access token');
  }
});

app.post("/webhook", async (req, res) => {
  const payload = req.body;

  if (payload.ref === "refs/heads/main") {
    console.log(`Push event received from ${payload.repository.name}`);
    const githubUrl = payload.repository.clone_url;
    
    try {
      await spinUpContainer({ githubUrl, env: {}, framework: 'auto' });
      res.status(200).send("Deployment successful!");
    } catch (error) {
      console.error("Deployment error", error);
      res.status(500).send("Deployment failed");
    }
  } else {
    res.status(200).send("Not a push to main branch");
  }
});

export default app;