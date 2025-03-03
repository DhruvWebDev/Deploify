import express from "express"
import { Request, Response } from "express"
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

const PORT = 3000;

app.listen(PORT, () => {
  console.log("Server listening on port", PORT);
});

app.post("/", async (req: Request, res: Response) => {
  const payload = req.body;
  console.log(payload)
  if (payload.ref === "refs/heads/main") {
    console.log(`Push event received from ${payload.repository.name}`);
    const githubUrl = payload.repository.clone_url;
    
  }
  res.status(200).send('Webhook received');
})

// Build endpoint
app.post("/build", async (req: Request, res: Response) => {
  const buildConfig = req.body;
  
  if (!buildConfig.githubUrl) {
    return res.status(400).json({ error: 'Missing required field: githubUrl' });
  }

  const deployId = uuidv4();
  res.status(200).json({ deployId });
});

// Deployment status endpoint
app.get("/deployment-status/:deployId", async (req: Request, res: Response) => {
  const { deployId } = req.params;
  res.status(200).json({ status: 'in_progress' });
});

// Logs endpoint
app.get("/logs/:deployId", async (req: Request, res: Response) => {
  const { deployId } = req.params;
  res.status(200).json({ logs: [] });
});
