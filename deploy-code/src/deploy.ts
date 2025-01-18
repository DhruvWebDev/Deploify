  import express from 'express';
  import cors from 'cors';
  import { WebSocketServer } from 'ws';
  import { exchangeCodeForToken } from './utils/exchange-code-for-token';
  import { encryptToken } from './utils/encrypt-decrypt';
  import cookieParser from 'cookie-parser';
  import { clerkMiddleware, getAuth, requireAuth } from '@clerk/express';
  import * as z from "zod";
  import { createKafkaClient } from './lib/kafka/client';
  import { generateSlug } from "random-word-slugs";
  import { PrismaClient } from "@prisma/client";
  import { createClient } from '@clickhouse/client';
  import { spinUpContainer } from './utils/spinUpContainer';
  import uniqid from "uniqid";

  const prisma = new PrismaClient();
  const app = express();
  const client = createClient();

  app.use(cors({
    origin: 'http://localhost:5173', // Adjust this to match your frontend URL
    credentials: true
  }));
  app.use(cookieParser());
  app.use(express.json());
  // app.use(clerkMiddleware());

  const port = 3000;
  const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("New WebSocket connection established");
  
  const sampleObject = {
    id: 1,
    name: "John Doe",
    age: 30,
  };
  ws.send(JSON.stringify(sampleObject));

  const deployId = uniqid();


wss.on("connection", (ws) => {
  console.log("New WebSocket connection established");

  const sampleObject = {
    id: 1,
    name: "John Doe",
    age: 30,
  };
  ws.send(JSON.stringify(sampleObject));

  ws.on("message", async (message) => {
    try {
      const parsedMessage = JSON.parse(message.toString());
      const { type, githubUrl, env, framework, deployId } = parsedMessage;
      console.log(`Received message => ${message}`);

      // Validate payload
      if (!type) {
        ws.send(JSON.stringify({ type: "error", message: 'Missing "type" in payload' }));
        return;
      }

      if (type === "build-project") {
        if (!githubUrl || !env || !framework) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: 'Missing required fields: "githubUrl", "env", or "framework"',
            })
          );
          return;
        }

        ws.send(JSON.stringify({ type: "log", message: "Starting deployment process..." }));

        try {
          const slug = generateSlug();
          const newDeployId = uniqid();

          console.log(newDeployId);

          // Save deployment record
          const prismaData = await prisma.project.create({
            data: {
              id: newDeployId,
              gitURL: githubUrl,
              subDomain: slug,
              user_id: "some_user_id112345676543", // Replace with actual user ID
            },
          });
          console.log(prismaData);

          await prisma.deployement.create({
            data: {
              id: prismaData.id,
              projectId: prismaData.id,
              status: "IN_PROGRESS",
            },
          });

          console.log("Done creating deployment insertion");

          console.log("Building Docker container");
          const result = await spinUpContainer({
            githubUrl,
            env,
            framework,
            deploy_id: newDeployId,
          });
          console.log(result, "result");

          await prisma.deployement.update({
            where: { id: newDeployId },
            data: { status: "READY" },
          });

          ws.send(
            JSON.stringify({
              type: "deployment-success",
              message: "Deployment completed successfully!",
              data: result,
            })
          );
        } catch (error) {
          console.log(error);

          await prisma.deployement.update({
            where: { id: newDeployId },
            data: { status: "FAIL" },
          });

          ws.send(
            JSON.stringify({
              type: "deployment-error",
              message: "Deployment failed: " + error.message,
            })
          );
        }
      } else if (type === "fetch-logs") {
        if (!deployId) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: 'Missing required field: "deployId"',
            })
          );
          return;
        }

        try {
          const logs = await client.query({
            query: `SELECT event_id, deployment_id, log, timestamp FROM log_events WHERE deployment_id = {deployment_id:String}`,
            query_params: { deployment_id: deployId },
            format: "JSONEachRow",
          });

          const rawLogs = await logs.json();
          ws.send(
            JSON.stringify({
              type: "logs",
              message: "Fetched logs successfully",
              logs: rawLogs,
            })
          );
        } catch (error) {
          ws.send(
            JSON.stringify({
              type: "fetch-logs-error",
              message: "Failed to fetch logs: " + error.message,
            })
          );
        }
      } else {
        ws.send(JSON.stringify({ type: "error", message: "Unsupported message type" }));
      }
    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(JSON.stringify({ type: "error", message: "Invalid JSON payload or internal server error" }));
    }
  });
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
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.redirect('http://localhost:5173');
    } catch (error) {
      console.error('Failed to get access token:', error);
      res.status(500).send('Failed to get access token');
    }
  });


  // Endpoint to get project ID by subdomain
  app.get('/get-project-id', async (req: any, res: any) => {
    const { subDomain } = req.query;

    if (!subDomain) {
      return res.status(400).json({ error: 'Subdomain is required' });
    }

    try {
      const project = await prisma.project.findFirst({
        where: { 
          subDomain: subDomain
        }
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

  app.post('/webhook', async (req, res) => {
    const payload = req.body;

    if (payload.ref === "refs/heads/main") {
      console.log(`Push event received from ${payload.ref}`);
      res.status(200).send(payload);
      // try {
      //   await spinUpContainer({ githubUrl, env: {}, framework: 'react' });
      //   res.status(200).send("Deployment successful!");
      // } catch (error) {
      //   console.error("Deployment error", error);
      //   res.status(500).send("Deployment failed");
      // }
    } else {
      res.status(200).send("Not a push to main branch");
    }
  });



  export default app;
