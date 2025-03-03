export const generateEnvFile = (env: Record<string, string>): string => {
    let envScript = 'echo "Creating .env file with environment variables..." &&\n';
  
    // Loop through the environment variables and generate the .env content
    for (const [key, value] of Object.entries(env)) {
      envScript += `echo "${key}=${value}" >> .env &&\n`;
    }
  
    return envScript;
  };
  