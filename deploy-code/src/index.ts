import express from "express";
import uniqid from "uniqid";
import simpleGit from "simple-git";
import path from "path";
import fs from "fs";
import { createClient } from "redis";
import { uploadFile } from "./uploadeBucket";
import { getAllFiles } from "./getFilePath";
import { buildProject } from "./build";
import cors from "cors";

const app = express();
app.use(cors())
const PORT = 3001;

app.use(express.json());

app.post("/deploy-code", async (req, res) => {
  try {
    const { github_url } = req.body;

    // Validate github_url
    if (!github_url || typeof github_url !== "string") {
      return res.status(400).json({ error: "Invalid or missing 'github_url' in request body" });
    }

    const generatedId = uniqid();
    const localPath = path.join(process.cwd(), "output", generatedId);

    console.log(`Generated ID: ${generatedId}`);
    console.log(`Cloning repository to: ${localPath}`);

    // Clone the repository
    try {
      await simpleGit().clone(github_url, localPath);
      console.log("Cloning complete. Starting build process...");
    } catch (cloneError) {
      console.error("Error cloning repository:", cloneError.message);
      throw new Error("Repository clone failed");
    }

    // Build the project
    try {
      await buildProject(generatedId);
      console.log("Build completed successfully.");
    } catch (buildError) {
      console.error("Build failed:", buildError.message);
      throw new Error("Build process failed");
    }

    // Check if the 'dist' folder exists
    const distFolder = path.join(localPath, "dist");
    if (!fs.existsSync(distFolder)) {
      throw new Error("Build folder 'dist' not found");
    }

    const files = getAllFiles(distFolder);
    console.log(`Uploading ${files.length} files to storage...`);

    // Upload files to storage
    for (const file of files) {
      const fileName = path.relative(distFolder, file);
      try {
        await uploadFile(fileName, file, generatedId);
      } catch (uploadError) {
        console.error("Error uploading file:", uploadError.message);
        throw new Error("File upload failed");
      }
    }

    // All files uploaded successfully
    console.log("All files uploaded successfully.");
    console.log("Temporary files cleaned up.");

    // Send the status to Redis queue after deployment
    res.status(200).json({ message: "Deployment successful" });

  } catch (error) {
    console.error("Deployment error:", error.message);
    // If the error happens, send failure status to Redis
    try {
      await publisher.publish("deployment-status", JSON.stringify({
        deploymentId: uniqid(),
        status: "failure",
        message: error.message
      }));
      console.log("Deployment failure status sent to Redis.");
    } catch (redisError) {
      console.error("Error publishing to Redis:", redisError.message);
    }
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
