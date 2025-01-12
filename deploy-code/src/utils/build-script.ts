import { buildScriptInterface } from "../type";
import { generateEnvFile } from "./generate-env-file";
import { getOutputFolder } from "./get-output-folder";
import { getAllFiles } from "./getFilePath";
import { uploadFile } from "./uploadeBucket";

export const getBuildScript = ({ githubUrl, env, framework, subdomainId }: buildScriptInterface): string => {
  const outputFolder = getOutputFolder(framework);
  // Generate the environment variables script
  const envScript = generateEnvFile(env); // Get the environment variable creation script
  // Get the file paths based on the output folder
  const files = getAllFiles(outputFolder);
  
  // Build the full build script
  const buildScript = `
    apt-get update && apt-get install -y git &&
    git clone ${githubUrl} /app &&
    cd /app &&
    npm install &&
    
    # Generate .env file
    ${envScript} &&
    
    # Build and start the app
    npm run build &&
    npm run dev -- --port=3000

    # Upload the output folder to the Supabase storage bucket
    (async () => {
      const files = ${JSON.stringify(files)};  // Array of file paths
      for (const file of files) {
        // Call the uploadFiles function for each file
        try {
          await uploadFile(file, '${outputFolder}', '${subdomainId}');
        } catch (error) {
          console.error("Error uploading file:", error.message);
        }
      }
    })()
  `;

  return buildScript;
};


/**
 * [
 *"c:\\Users\\mso15\\OneDrive\\Documents\\GitHub\\Deploify\\deploy-code\\src\\utils\\abc\\123.txt","c:\\Users\\mso15\\OneDrive\\Documents\\GitHub\\Deploify\\deploy-code\\src\\utils\\abc\\1234321\\abc.txt","c:\\Users\\mso15\\OneDrive\\Documents\\GitHub\\Deploify\\deploy-code\\src\\utils\\abc\\234\\file.txt","c:\\Users\\mso15\\OneDrive\\Documents\\GitHub\\Deploify\\deploy-code\\src\\utils\\abc\\asdf.t"
 * ]
 */