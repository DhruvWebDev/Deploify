export const generateEnvFile = (env: Record<string, string>): string => {
    let envScript = 'echo "Creating .env file with environment variables..." &&\n';
  
    // Loop through the environment variables and generate the .env content
    for (const [key, value] of Object.entries(env)) {
      envScript += `echo "${key}=${value}" >> .env &&\n`;
    }
  
    return envScript;
  };
  
//   const env = {
//     DATABASE_URL: 'postgres://user:password@localhost:5432/mydb',
//     API_KEY: 'your-api-key-here',
//     NODE_ENV: 'production',
//     PORT: '3000',
//     SECRET_KEY: 'mysecretkey',
//   };
  
//   const output = generateEnvFile(env)
//   console.log(output);

