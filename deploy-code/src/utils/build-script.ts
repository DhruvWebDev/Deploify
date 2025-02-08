import { buildScriptInterface } from "../type";
import { generateEnvFile } from "./generate-env-file";
import { getOutputFolder } from "./get-output-folder";

export const getBuildScript = async ({
  githubUrl,
  env,
  framework,
  subdomainId,
}: buildScriptInterface) => {
  const outputFolder = getOutputFolder(framework);
  
  // Generate the environment variables script
  const envScript = generateEnvFile(env);
  
  // Escape special characters in the environment variables
  const escapedEnvScript = envScript.replace(/"/g, '\\"');

  const buildScript = `#!/bin/bash
set -e

# Update and install dependencies
apt-get update && apt-get install -y git
git clone ${githubUrl} /app
cd /app

# Write environment variables
echo "${escapedEnvScript}" > .env

# Install dependencies
npm install
npm install @supabase/supabase-js dotenv

# Create uploadBucket.js file
cat > /app/uploadBucket.js << 'EOL'
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://prbhqalytjobgefpqicz.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByYmhxYWx5dGpvYmdlZnBxaWN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0NTk5NzcsImV4cCI6MjA1MTAzNTk3N30.-ztObVrO-bX28IybZ2-W4sCQl6sW1u9w3QpdRLzJVTo';

if (!supabaseKey) {
  throw new Error('SUPABASE_KEY environment variable is required');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const getMimeType = (filePath) => {
  const extname = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain',
    '.pdf': 'application/pdf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
  };
  return mimeTypes[extname] || 'application/octet-stream';
};

export const uploadFile = async ({ fileName, localFilePath, subdomainId }) => {
  console.log(\`Uploading file: \${fileName} from \${localFilePath}\`);
  
  try {
    if (!fs.existsSync(localFilePath)) {
      throw new Error(\`File not found: \${localFilePath}\`);
    }

    const fileContent = fs.readFileSync(localFilePath);
    const mimeType = getMimeType(localFilePath);
    const bucketName = 'file';
    const filePath = \`\${subdomainId}/\${fileName}\`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileContent, {
        cacheControl: '3600',
        upsert: true,
        contentType: mimeType,
      });

    if (error) {
      throw error;
    }

    console.log(\`Successfully uploaded \${fileName}\`);
    return data;
  } catch (error) {
    console.error(\`Error uploading \${fileName}:, \${error.message}\`);
    throw error;
  }
};
EOL

# Create getFilePath.js utility
cat > /app/getFilePath.js << 'EOL'
import fs from 'fs';
import path from 'path';

export const getAllFiles = function(dirPath) {
  const files = [];
  
  function traverse(currentPath, relativePath = '') {
    const entries = fs.readdirSync(currentPath);
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath, path.join(relativePath, entry));
      } else {
        files.push({
          fileName: path.join(relativePath, entry),
          fullPath: fullPath
        });
      }
    }
  }
  
  traverse(dirPath);
  return files;
};
EOL

# Create uploadFiles.js script
cat > /app/uploadFiles.js << 'EOL'
import { getAllFiles } from './getFilePath.js';
import { uploadFile } from './uploadBucket.js';

const outputFolder = '${outputFolder}';
const subdomainId = '${subdomainId}';

(async () => {
  try {
    console.log(\`Starting upload from \${outputFolder} for subdomain \${subdomainId}\`);
    
    // Build the project
    console.log('Building project...');    
    const files = getAllFiles(outputFolder);
    console.log(\`Found \${files.length} files to upload\`);
    
    for (const { fileName, fullPath } of files) {
      try {
        await uploadFile({
          fileName,
          localFilePath: fullPath,
          subdomainId
        });
      } catch (error) {
        console.error(\`Failed to upload \${fileName}: \${error.message}\`);
      }
    }
    
    console.log('All files processed successfully!');
  } catch (error) {
    console.error('Upload process failed:', error.message);
    process.exit(1);
  }
})();
EOL

# Make scripts executable
chmod +x /app/uploadFiles.js

# Install project dependencies and build
npm install
npm run build

# Run upload script
node --experimental-json-modules /app/uploadFiles.js || exit 1

echo "Build and upload process completed successfully"`;

  return buildScript;
};