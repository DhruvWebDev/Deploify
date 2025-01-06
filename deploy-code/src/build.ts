import { exec } from "child_process";
import path from "path";

export function buildProject(id: string) {
    return new Promise((resolve, reject) => {
        // Use project root instead of __dirname
        const projectRoot = path.resolve(__dirname, ".."); // Adjust as needed
        const projectPath = path.join(projectRoot, "output", id);
        console.log(projectPath,projectRoot)
        const child = exec(`cd ${projectPath} && npm install && npm run build`);

        child.stdout?.on('data', function(data) {
            console.log('stdout: ' + data);
        });
        child.stderr?.on('data', function(data) {
            console.log('stderr: ' + data);
        });

        child.on('close', function(code) {
           resolve("")
        });
    });
}
