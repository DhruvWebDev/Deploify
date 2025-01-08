import express from 'express';
import Docker from 'dockerode';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

// Initialize Docker
const docker = new Docker();
// Create Express app
const app = express();
app.use(cors());
const port = 9000;

// Add JSON body parser
app.use(express.json());
const folderPath = path.join(__dirname, 'logs-file'); // Nested folders
const filePath = path.join(folderPath, 'example.txt'); // File inside the nested folder

// Create the folder if it doesn't exist
if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath, { recursive: true }); // Create nested folders if not exist
}

// Function to spin up a Docker container and build from GitHub
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
        console.log('Image pulled successfully');
      } else {
        throw error;
      }
    }

    // Create a script to clone and build the project
    const buildScript = `
      # Install git
      apt-get update && apt-get install -y git

      # Clone the repository
      git clone ${githubUrl} /app

      # Go to app directory
      cd /app

      # Install dependencies
      npm install

      # Build the project
      npm run build

      #Run the project
      npm run dev
    `;

    // Create a Docker container with build process
    const container = await docker.createContainer({
      Image: imageName,
      // Run the build script in a shell
      Cmd: ['/bin/bash', '-c', buildScript],
      ExposedPorts: {
        '8080/tcp': {}
      },
      HostConfig: {
        PortBindings: {
          '8080/tcp': [
            {
              HostPort: '0' // Dynamically assign a port
            }
          ]
        },
        AutoRemove: true, // Automatically remove the container when it stops
      },
      name: `node-app-${Date.now()}`, // Give each container a unique name
      Tty: true, // Keep the terminal open
      AttachStdout: true,
      AttachStderr: true
    });

    // Start the container
    await container.start();
    
    // Stream the build logs
    const stream = await container.attach({
      stream: true,
      stdout: true,
      stderr: true
    });

    // Return container info and stream for logging
    const containerInfo = await container.inspect();
    const hostPort = containerInfo.NetworkSettings.Ports['8080/tcp'][0].HostPort;
    
    console.log(`Docker container started. Port ${hostPort} mapped to container port 8080`);
    
    // Stream the build logs to console and append them to the file
    stream.on('data', (chunk) => {
      const logData = chunk.toString();
      fs.appendFileSync(filePath, logData + '\n', 'utf8'); // Add a newline after each chunk
      console.log('Build log:', logData); // Log the chunk in the console for debugging
    });

    return {
      id: container.id,
      port: hostPort
    };
  } catch (error) {
    console.error('Error starting Docker container:', error);
    throw error;
  }
}

// API route to trigger the deployment
app.post('/deploy', async (req, res) => {
  try {
    const { github_url: githubUrl } = req.body;
    
    if (!githubUrl) {
      return res.status(400).json({
        error: 'Missing required parameter',
        message: 'githubUrl is required in the request body'
      });
    }

    console.log(`Spinning up Docker container for ${githubUrl}...`);
    
    const containerInfo = await spinUpContainer(githubUrl);

    // Wait for a brief moment to ensure logs are written
      try {
        const logs = fs.readFileSync(filePath, 'utf8');
        res.status(200).json({
          message: 'Docker container started successfully!',
          containerId: containerInfo.id,
          port: containerInfo.port,
          githubUrl,
          logs
        });
      } catch (error) {
        console.error('Failed to read logs:', error);
        res.status(500).json({
          error: 'Error reading logs',
          message: error.message
        });
      }
  } catch (error) {
    console.error('Deployment failed:', error);
    res.status(500).json({
      error: 'Deployment failed',
      message: error.message
    });
  }
});

// API route to list all running containers
app.get('/containers', async (req, res) => {
  try {
    const containers = await docker.listContainers();
    res.status(200).json(containers);
  } catch (error) {
    console.error('Failed to list containers:', error);
    res.status(500).json({
      error: 'Failed to list containers',
      message: error.message
    });
  }
});

// API route to stop a container
app.delete('/containers/:id', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.stop();
    res.status(200).json({ message: 'Container stopped successfully' });
  } catch (error) {
    console.error('Failed to stop container:', error);
    res.status(500).json({
      error: 'Failed to stop container',
      message: error.message
    });
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`API is running on http://localhost:${port}`);
});
