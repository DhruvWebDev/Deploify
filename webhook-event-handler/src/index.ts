import express from "express"

const app = express();
app.use(express.json());
const PORT = 3001;
app.listen(PORT, () => {
  console.log("Server listening on port", PORT);
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
    console.log(`Push event received from  ${payload.repository}`)
    res.status(200).send("Not a push to main branch");
  }
});
