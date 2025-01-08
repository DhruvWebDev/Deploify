import express from 'express';
import Docker from 'dockerode';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { createProxyMiddleware } from 'http-proxy-middleware';
import uniqid from 'uniqid';

// Initialize Docker and Express
const docker = new Docker();
const app = express();
app.use(cors());
const port = 3000;

// Add JSON body parser
app.use(express.json());

// Store container mappings in memory
const containerMappings = new Map();

// Subdomain handling middleware
app.use(async (req, res, next) => {
  const host = req.headers.host;
  
  // Skip if it's the main domain or API endpoints
  if (host === `localhost:${port}` || req.path.startsWith('/deploy') || req.path.startsWith('/containers')) {
    /**
     * Middleware Function: Middleware functions are functions that have access to the request object (req), the response object (res), and the next middleware function in the application’s request-response cycle.
     next() Function: The next function is a callback that you call to pass control to the next middleware function. If you don't call next(), the request will be left hanging.
     */
    return next();
  }
  
  // Extract subdomain
  const subdomain = host.split('.')[0];
  const containerPort = containerMappings.get(subdomain);
  
  if (!containerPort) {
    return res.status(404).json({ 
      error: 'Container not found',
      message: `No container found for ${subdomain}`
    });
  }

  // Create and use proxy middleware
  const proxy = createProxyMiddleware({
    target: `http://localhost:${containerPort}`,
    changeOrigin: true,
    ws: true,
    onProxyReq: (proxyReq, req) => {
      // Add custom headers
      proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
      proxyReq.setHeader('X-Container-ID', subdomain);
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(502).json({
        error: 'Bad Gateway',
        message: 'Unable to connect to container'
      });
    }
  });

  return proxy(req, res, next);
});

async function spinUpContainer(githubUrl) {
  try {
    const imageName = 'node:20';
    
    // Pull the image if it doesn't exist
    try {
      await docker.getImage(imageName).inspect();
    } catch (error) {
      if (error.statusCode === 404) {
        console.log('Image not found locally, pulling...');
        await new Promise((resolve, reject) => {
          docker.pull(imageName, (err, stream) => {
            if (err) return reject(err);
            docker.modem.followProgress(stream, (err, output) => {
              if (err) return reject(err);
              resolve(output);
            });
          });
        });
      } else {
        throw error;
      }
    }

    // Create build script
    const buildScript = `
      apt-get update && apt-get install -y git &&
      git clone ${githubUrl} /app &&
      cd /app &&
      npm install &&
      npm run build
      npm run dev
    `;

    // Generate unique subdomain ID
    const subdomainId = uniqid();    
    // Create container
    const container = await docker.createContainer({
      Image: imageName,
      Cmd: ['/bin/bash', '-c', buildScript],
      ExposedPorts: {
        '8080/tcp': {}
      },
      HostConfig: {
        PortBindings: {
          '8080/tcp': [{ HostPort: '0' }]
        },
        AutoRemove: true
      },
      name: `node-app-${subdomainId}`
    });

    // Start container
    await container.start();
    
    // Get container info and port
    const containerInfo = await container.inspect();
    const hostPort = containerInfo.NetworkSettings.Ports['8080/tcp'][0].HostPort;
    
    // Store mapping
    containerMappings.set(subdomainId, hostPort);
    
    return {
      id: container.id,
      port: hostPort,
      subdomainId
    };
  } catch (error) {
    console.error('Error starting container:', error);
    throw error;
  }
}

// Deploy endpoint
app.post('/deploy', async (req, res) => {
  try {
    const { github_url: githubUrl } = req.body;
    
    if (!githubUrl) {
      return res.status(400).json({
        error: 'Missing parameter',
        message: 'github_url is required'
      });
    }

    const containerInfo = await spinUpContainer(githubUrl);
    
    res.status(200).json({
      message: 'Container deployed successfully!',
      containerId: containerInfo.id,
      url: `${containerInfo.subdomainId}.localhost:${port}`,
      port: containerInfo.port
    });
  } catch (error) {
    res.status(500).json({
      error: 'Deployment failed',
      message: error.message
    });
  }
});

// List containers
app.get('/containers', async (req, res) => {
  try {
    const containers = await docker.listContainers();
    const mappings = Array.from(containerMappings.entries()).map(([subdomain, port]) => ({
      subdomain,
      port,
      url: `${subdomain}.localhost:${port}`
    }));
    res.json(mappings);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list containers',
      message: error.message
    });
  }
});

// Stop container
app.delete('/containers/:id', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.stop();
    
    // Clean up mapping
    for (const [subdomain, port] of containerMappings.entries()) {
      if (port === container.id) {
        containerMappings.delete(subdomain);
        break;
      }
    }
    
    res.json({ message: 'Container stopped successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to stop container',
      message: error.message
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Access containers at <container-id>.localhost:${port}`);
});