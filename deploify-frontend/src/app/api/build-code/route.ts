import uniqid from 'uniqid';
import simpleGit from 'simple-git';
import path from 'path';
import fs from 'fs';
import { getAllFiles } from '@/utils/getPath';  // Ensure this function works as expected
import { uploadFile } from '@/axios/api/uploadeBucket';  // Ensure this function works for uploading files
import { createClient } from "redis";
import { BASE_URL } from '@/axios/git-repo-api';
import axios from 'axios';
const publisher = createClient();
publisher.connect();  
// Named export for POST method
export async function POST(req: Request, res: Response) {
    try {
        // Extract the GitHub URL from the request body
        const { github_url } = await req.json();
        console.log('Received GitHub URL:', github_url);

        // Check if the GitHub URL is provided
        if (!github_url) {
            return new Response(JSON.stringify({ error: 'GitHub URL is required' }), { status: 400 });
        }

        // Generate a unique ID for the folder name
        const generatedId = uniqid();
        console.log('Generated ID:', generatedId);

        // Construct the local path where the repository will be cloned
        const localPath = path.join(process.cwd(), 'output', generatedId);  // Use process.cwd() for absolute path
        console.log('Cloning to path:', localPath);

        // Clone the repository
        await simpleGit().clone(github_url, localPath);

        // Get all files from the cloned repository
        const files = getAllFiles(localPath);  // Use the localPath directly

        // Upload each file to the storage bucket
        for (const file of files) {
            const fileName = file.replace(localPath + path.sep, '');  // Strip the local path from the file name
            await uploadFile(fileName, file, generatedId);  // Upload the file using the correct relative file name
        }

        publisher.lPush('build-queue' ,generatedId)
        // Return success response
        return new Response(JSON.stringify({ message: 'Repository cloned and files uploaded successfully', path: localPath }), { status: 200 });
    } catch (error) {
        console.error('Error cloning repository:', error);
        return new Response(JSON.stringify({ error: 'Failed to clone repository', details: error.message }), { status: 500 });
    }
}
