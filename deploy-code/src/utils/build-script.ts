import { buildScriptInterface } from "../type";
import { generateEnvFile } from "./generate-env-file";
import { getOutputFolder } from "./get-output-folder";
export const getBuildScript = async ({ githubUrl, env, framework, subdomainId }: buildScriptInterface) => {
  const outputFolder = getOutputFolder(framework);
  console.log(outputFolder);

  // Generate the environment variables script
  const envScript = generateEnvFile(env); // Get the environment variable creation script
  console.log(envScript, "env");

  // Build the full build script
  const buildScript = `
    apt-get update && apt-get install -y git &&
    git clone ${githubUrl} /app &&
    cd /app &&
    npm install &&

    # Copy the uploadeBucket.ts file into the container
    COPY deploy-code/src/utils/uploadeBucket.ts /app/uploadeBucket.ts &&
      echo "${envScript}" > .env &&

    # Build the app
    npm run build &&

    # Upload files
    node -e "
      const { uploadFile } = require('./uploadeBucket');
      const path = require('path');
      const { uploadFile } = require('./uploadBucket');
      const outputFolder = '${outputFolder}';
      #Files path(got by recursive method)
      const files = require('./getFilePath').getAllFiles(outputFolder);

      (async () => {
        for (const file of files) {
          try {
            await uploadFile('{file}',path.join(outputFolder, file), '${subdomainId}');
          } catch (error) {
            console.error('Error uploading file:', error.message);
          }
        }
      })();
    "
  `;
  return buildScript;
};
