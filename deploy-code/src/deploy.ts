import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import { getClickhouseClient } from './lib/clickhouse/client';
import { generateSlug } from 'random-word-slugs';
import uniqid from 'uniqid';
import { spinUpContainer } from './utils/spinUpContainer';

const prisma = new PrismaClient();
const app = express();
const client = getClickhouseClient();

app.use(
  cors({
    origin: 'http://localhost:5173', // Adjust this to match your frontend URL
    credentials: true,
  })
);
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
      const parsedMessage = JSON.parse(message.toString());
      const { type, githubUrl, env, framework, deployId } = parsedMessage;
      console.log(`Received message => ${message}`);
      const newDeployId = uniqid();

      // Validate payload
      if (!type) {
        ws.send(JSON.stringify({ type: 'error', message: 'Missing "type" in payload' }));
        return;
      }

      if (type === 'build-project') {
        if (!githubUrl || !env || !framework) {
          ws.send(
            JSON.stringify({
              type: 'error',
              message: 'Missing required fields: "githubUrl", "env", or "framework"',
            })
          );
          return;
        }

        ws.send(JSON.stringify({ type: 'log', message: 'Starting deployment process...' }));

        try {
          const slug = generateSlug();

          // Save deployment record
          const prismaData = await prisma.project.create({
            data: {
              id: newDeployId,
              gitURL: githubUrl,
              subDomain: slug,
              user_id: 'some_user_id11', // Replace with actual user ID
            },
          });
          console.log(prismaData);

          await prisma.deployement.create({
            data: {
              id: prismaData.id,
              projectId: prismaData.id,
              status: 'IN_PROGRESS',
            },
          });

          console.log('Done creating deployment insertion');

          console.log('Building Docker container');
          const result = await spinUpContainer({
            githubUrl,
            env,
            framework,
            deploy_id: newDeployId,
          });
          console.log(result, 'result');

          await prisma.deployement.update({
            where: { id: newDeployId },
            data: { status: 'READY' },
          });

          ws.send(
            JSON.stringify({
              type: 'deployment-success',
              message: 'Deployment completed successfully!',
              data: result,
            })
          );
        } catch (error) {
          console.log(error);

          await prisma.deployement.update({
            where: { id: newDeployId },
            data: { status: 'FAIL' },
          });

          ws.send(
            JSON.stringify({
              type: 'deployment-error',
              message: 'Deployment failed: ' + error.message,
            })
          );
        }
      } else if (type === 'fetch-logs') {
        if (!deployId) {
          ws.send(
            JSON.stringify({
              type: 'error',
              message: 'Missing required field: "deployId"',
            })
          );
          return;
        }

        try {
          const logs = await (await (await client).query({
            query: `
              SELECT event_id, deployment_id, log
              FROM log_events
              WHERE deployment_id = '{deployment_id}'`,
            query_params: {
              deployment_id: deployId,
            },
          })).json(); // Parse the result          const rawLogs = await logs.json();
          ws.send(
            JSON.stringify({
              type: 'logs',
              message: 'Fetched logs successfully',
              logs: logs,
            })
          );
        } catch (error) {
          ws.send(
            JSON.stringify({
              type: 'fetch-logs-error',
              message: 'Failed to fetch logs: ' + error.message,
            })
          );
        }
      } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Unsupported message type' }));
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON payload or internal server error' }));
    }
  });
});

// Endpoint to get project ID by subdomain
app.get('/get-project-id', async (req, res) => {
  const { subDomain } = req.query;

  if (!subDomain) {
    return res.status(400).json({ error: 'Subdomain is required' });
  }

  try {
    const project = await prisma.project.findFirst({
      where: {
        subDomain: subDomain,
      },
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

// Endpoint to store analytics data
app.post('/analytics', async (req, res) => {
  const { projectId, page } = req.body;

  if (!projectId || !page) {
    return res.status(400).json({ error: 'Project ID and page are required' });
  }

  try {
    const analytics = await prisma.analytics.create({
      data: {
        projectId, // Foreign key reference to Project
        page, // The page or event information
      },
    });

    res.status(200).json({ message: 'Analytics data stored successfully', data: analytics });
  } catch (error) {
    console.error('Error storing analytics data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to handle webhook events
app.post('/webhook', async (req, res) => {
  const payload = req.body;

  if (payload.ref === 'refs/heads/main') {
    console.log(`Push event received from ${payload.ref}`);
    res.status(200).send(payload);
  } else {
    res.status(200).send('Not a push to main branch');
  }
});

export default app;