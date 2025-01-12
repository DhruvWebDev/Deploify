import Docker from 'dockerode';
import uniqid from "uniqid"
import {buildInterface, statusCode,buildScriptInterface} from "../type/index"
import { getBuildScript } from './build-script';
import { publisher } from '../lib/redis/redis';
const docker = new Docker();

export async function spinUpContainer({githubUrl, env, framework}: buildInterface) {
    try {
      const imageName = 'node:20';
  
      // Pull the image if it doesn't exist
      try {
        await docker.getImage(imageName).inspect();
      } catch (error) {
        if ((error as any)?.statusCode === 404) {
          console.log('Image not found locally, pulling...');
          await new Promise((resolve, reject) => {
            docker.pull(imageName, (err:any, stream:any) => {
              if (err) return reject(err);
              docker.modem.followProgress(stream, (err:any, output:any) => {
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
      const buildScript = getBuildScript({ githubUrl, env, framework, subdomainId } as buildScriptInterface);
  
      // Generate unique subdomain ID
  
      // Create container
      const container = await docker.createContainer({
        Image: imageName,
        Cmd: ['/bin/bash', '-c', buildScript],
        ExposedPorts: {
          '3000/tcp': {},
        },
        HostConfig: {
          PortBindings: {
            '3000/tcp': [{ HostPort: '0' }],
          },
          AutoRemove: true,
        },
        name: `node-app-${subdomainId}`,
      });
  
      // Start container
      await container.start();
  
      // Get container info and port
      const containerInfo = await container.inspect();
      const hostPort = containerInfo.NetworkSettings.Ports['3000/tcp'][0].HostPort;
  
      // Store mapping
      await publisher.set(subdomainId, hostPort, {
        NX: true, // Only set the key if it doesn't already exist
      });
  
      return {
        id: container.id,
        port: hostPort,
        subdomainId,
      };
    } catch (error) {
      console.error('Error starting container:', error);
      throw error;
    }
  }
  