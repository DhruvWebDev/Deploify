import Docker from 'dockerode';
import uniqid from 'uniqid';
import { buildInterface, buildScriptInterface } from "../type/index";
import { getBuildScript } from './build-script';
import { formatLog, sendLogToKafka, initialKafka } from '../utils/logs'; // Import the logging utilities
import { log } from 'console';

const docker = new Docker();

export async function spinUpContainer({ githubUrl, env, framework, deploy_id }: buildInterface) {
    try {
        const imageName = 'node:20';
        // Pull the image if it doesn't exist
        try {
            await docker.getImage(imageName).inspect();
        } catch (error) {
            if ((error as any)?.statusCode === 404) {
                console.log(formatLog('Image not found locally, pulling...'));
                await new Promise((resolve, reject) => {
                    docker.pull(imageName, (err: any, stream: any) => {
                        if (err) return reject(err);
                        docker.modem.followProgress(stream, (err: any, output: any) => {
                            if (err) return reject(err);
                            resolve(output);
                        });
                    });
                });
            } else {
                throw error;
            }
        }

        const subdomainId = uniqid();
        const buildScript = await getBuildScript({ githubUrl, env, framework, subdomainId } as buildScriptInterface);
        console.log(buildScript)

        // Create container
        const container = await docker.createContainer({
            Image: imageName,
            Cmd: ['/bin/bash', '-c', buildScript],
            ExposedPorts: {
                '5173/tcp': {},
            },
            HostConfig: {
                PortBindings: {
                    '5173/tcp': [{ HostPort: '9090' }],
                },
                AutoRemove: true,
            },
            name: `node-app-${deploy_id}`,
            Tty: true, // Keep the terminal open
            AttachStdout: true,
            AttachStderr: true
        });

        // Start container
        await container.start();

        // Get container info and port
        const containerInfo = await container.inspect();
        // const hostPort = containerInfo.NetworkSettings.Ports['3000/tcp'][0].HostPort;

        // Attach to container logs
        const stream = await container.attach({ stream: true, stdout: true, stderr: true });

        // Stream logs to Kafka
        stream.on('data', async (chunk) => {
            const logData = chunk.toString('utf8');
            console.log("log", logData);
            console.log(formatLog(logData)); // Log locally
            try {
                // Send logs to Kafka, passing the deploy_id
                await sendLogToKafka(logData, deploy_id);
            } catch (err) {
                console.error(formatLog(`Error sending log to Kafka: ${err.message}`));
            }
        });

        // Handle errors in streaming
        stream.on('error', (err) => {
            console.error(formatLog(`Error in container log stream: ${err.message}`));
        });

        // Initialize Kafka consumer with the deploy_id
        initialKafka(deploy_id).catch((err) => {
            console.error(formatLog(`Error initializing Kafka: ${err.message}`));
        });

        return {
            id: container.id,
            port: 9000,
            subdomainId,
        };
    } catch (error) {
        console.error(formatLog(`Error starting container: ${error.message}`));
        throw error;
    }
}
