import express from "express";
import uniqid from "uniqid";
import simpleGit from "simple-git";
import path from "path";
import fs from "fs";
import {createClient} from "redis";
import { uploadFile } from "./uploadeBucket";
import { getAllFiles } from "./getFilePath";
import { buildProject } from "./build";
const publisher  = createClient();
publisher.connect();
//Just need to send the status of the deployment to the redis queue


const app = express();
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
        await simpleGit().clone(github_url, localPath);

        console.log("Cloning complete. Starting build process...");
        try {
            await buildProject(generatedId);
            console.log("Build completed successfully.");
        } catch (buildError) {
            console.error("Build failed:", buildError?.message);
            throw new Error("Build process failed");
        }

        const distFolder = path.join(localPath, "dist");
        if (!fs.existsSync(distFolder)) {
            throw new Error("Build folder 'dist' not found");
        }

        const files = getAllFiles(distFolder);
        console.log(`Uploading ${files.length} files to storage...`);
        for (const file of files) {
            const fileName = path.relative(distFolder, file);
            await uploadFile(fileName, file, generatedId);
        }

        console.log("All files uploaded successfully.");
        console.log("Temporary files cleaned up.");
        res.status(200).json({ message: "Deployment successful" });
    } catch (error) {
        console.error("Deployment error:", error?.message);
        res.status(500).json({ error: error?.message || "Internal server error" });
    }
});

app.listen(3001, () => {
    console.log("Server listening on port 3001");
})