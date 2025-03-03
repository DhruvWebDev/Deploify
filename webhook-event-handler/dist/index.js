var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from "express";
import { v4 as uuidv4 } from 'uuid';
const app = express();
app.use(express.json());
const PORT = 3000;
app.listen(PORT, () => {
    console.log("Server listening on port", PORT);
});
app.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = req.body;
    console.log(payload);
    if (payload.ref === "refs/heads/main") {
        console.log(`Push event received from ${payload.repository.name}`);
        const githubUrl = payload.repository.clone_url;
    }
    res.status(200).send('Webhook received');
}));
// Build endpoint
app.post("/build", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const buildConfig = req.body;
    if (!buildConfig.githubUrl) {
        return res.status(400).json({ error: 'Missing required field: githubUrl' });
    }
    const deployId = uuidv4();
    res.status(200).json({ deployId });
}));
// Deployment status endpoint
app.get("/deployment-status/:deployId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { deployId } = req.params;
    res.status(200).json({ status: 'in_progress' });
}));
// Logs endpoint
app.get("/logs/:deployId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { deployId } = req.params;
    res.status(200).json({ logs: [] });
}));
