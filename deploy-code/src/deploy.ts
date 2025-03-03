import express from 'express';
import { Request, Response } from 'express';
import cors from 'cors';
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

// HTTP endpoint to build and deploy a project
app.post('/api/projects/deploy', async (req:Request, res:Response) => {
  try {
    const { githubUrl, env, framework } = req.body;

    // Validate payload
    if (!githubUrl || !env || !framework) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: "githubUrl", "env", or "framework"',
      });
    }

    const newDeployId = uniqid();
    
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

      // Start the long-running process
      console.log('Building Docker container');
      
      // Since this is no longer a WebSocket, we'll return immediately after starting the process
      res.status(202).json({
        success: true,
        message: 'Deployment process started',
        deployId: newDeployId,
        subDomain: slug
      });
      
      // Continue the process after sending the response
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
      
      // Note: Since we've already sent the response, we can't notify the client here
      // The client will need to poll the status endpoint to check for completion
      
    } catch (error) {
      console.log(error);

      // Update the deployment status to FAIL if an error occurs
      await prisma.deployement.update({
        where: { id: newDeployId },
        data: { status: 'FAIL' },
      });
      
      // If we haven't sent a response yet, send an error
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Deployment failed: ' + error,
        });
      }
      // Otherwise, the client will need to check the status endpoint
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// HTTP endpoint to check deployment status
app.get('/api/deployments/:deployId/status', async (req: Request, res: Response) => {
  try {
    const { deployId } = req.params;

    if (!deployId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: "deployId"',
      });
    }

    const deployment = await prisma.deployement.findUnique({
      where: { id: deployId },
    });

    if (!deployment) {
      return res.status(404).json({
        success: false,
        message: 'Deployment not found',
      });
    }

    res.status(200).json({
      success: true,
      status: deployment.status,
    });
  } catch (error) {
    console.error('Error fetching deployment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deployment status: ' + error,
    });
  }
});

// HTTP endpoint to fetch logs
app.get('/api/deployments/:deployId/logs', async (req: Request, res: Response) => {
  try {
    const { deployId } = req.params;

    if (!deployId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: "deployId"',
      });
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
      })).json();
      
      res.status(200).json({
        success: true,
        message: 'Fetched logs successfully',
        logs: logs,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch logs: ' + error,
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Endpoint to get project ID by subdomain
app.get('/api/projects', async (req: Request, res: Response) => {
  const { subDomain } = req.query;

  if (!subDomain) {
    return res.status(400).json({ error: 'Subdomain is required' });
  }

  try {
    const project = await prisma.project.findFirst({
      where: {
        subDomain: subDomain as string,
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
app.post('/api/analytics', async (req: Request, res: Response) => {
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
