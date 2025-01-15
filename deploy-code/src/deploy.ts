import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { spinUpContainer } from './utils/spinUpContainer';
import { exchangeCodeForToken } from './utils/exchange-code-for-token';
import { encryptToken } from './utils/encrypt-decrypt';
import cookieParser from 'cookie-parser';
import { clerkMiddleware, getAuth, requireAuth } from '@clerk/express';
import * as z from "zod";
import { createKafkaClient } from './lib/kafka/client';
import uniqid from 'uniqid';
import { generateSlug } from "random-word-slugs";
import { PrismaClient } from "@prisma/client";
import { createClient } from '@clickhouse/client';

const prisma = new PrismaClient();
const app = express();
const client = createClient();

app.use(cors({
  origin: 'http://localhost:5173', // Adjust this to match your frontend URL
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(clerkMiddleware());

const port = 3000;
const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

const wss = new WebSocketServer({ server });

// WebSocket connection for logs
wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');

  ws.on('message', async (message) => {
    try {
      const { type, deployment_id } = JSON.parse(message.toString());
      console.log(`Received message => ${message}`);

      if (type === "fetch-logs") {
        // Fetch logs from ClickHouse for the given deployment ID
        try {
          const logs = await client.query({
            query: `
              SELECT event_id, deployment_id, log, timestamp 
              FROM log_events 
              WHERE deployment_id = {deployment_id:String}`,
            query_params: { deployment_id },
            format: 'JSONEachRow'
          });

          const rawLogs = await logs.json();

          // Send logs via WebSocket
          ws.send(JSON.stringify({
            type: 'fetch-logs',
            deployment_id,
            logs: rawLogs
          }));
        } catch (error) {
          console.error('Error fetching logs:', error);
          ws.send(JSON.stringify({ type: 'error', message: 'Failed to fetch logs' }));
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

// Endpoint to get project ID by subdomain
app.get('/get-project-id', async (req: any, res: any) => {
  const { subDomain } = req.body;

  if (!subDomain) {
    return res.status(400).json({ error: 'Subdomain is required' });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { subDomain }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.status(200).json({ projectId: project.id });
  } catch (error) {
    console.error('Error fetching project ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Other endpoints remain unchanged...

app.post('/analytics', async (req: any, res: any) => {
  const { projectId, page } = req.body;

  if (!projectId || !page) {
    return res.status(400).json({ error: 'Project ID and page are required' });
  }

  try {
    const analytics = await prisma.analytics.create({
      data: {
        projectId, // Foreign key reference to Project
        page,      // The page or event information
      },
    });

    res.status(200).json({ message: 'Analytics data stored successfully', data: analytics });
  } catch (error) {
    console.error('Error storing analytics data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// app.post('/webhook', async (req, res) => {
//   const payload = req.body;

//   if (payload.ref === "refs/heads/main") {
//     console.log(`Push event received from ${payload.repository.name}`);
//     const githubUrl = payload.repository.clone_url;

//     try {
//       await spinUpContainer({ githubUrl, env: {}, framework: 'auto' });
//       res.status(200).send("Deployment successful!");
//     } catch (error) {
//       console.error("Deployment error", error);
//       res.status(500).send("Deployment failed");
//     }
//   } else {
//     res.status(200).send("Not a push to main branch");
//   }
// });

export default app;
