const axios = require('axios');
const { describe, it, expect } = require('node:test');
const WebSocket = require('ws');

// Constants for reusable data
const MOCK_ANALYTICS_DATA = {
  projectId: '38v8rr36t4m5zszuxd',
  page: '/test-page',
};

const MOCK_SUBDOMAIN_DATA = {
  subdomainId: 'scarce-brown-application',
};

const MOCK_WEBHOOK_DATA = {
  ref: 'refs/heads/main',
};

const MOCK_BUILD_CONFIGS = {
  type: 'build-logs',
  githubUrl: 'https://github.com/hkirat/react-boilerplate',
  env: {},
  framework: 'react',
};

const MOCK_INVALID_BUILD_CONFIGS = {
  type: 'build-logs',
  env: {},
  framework: 'react',
};

const MOCK_FETCH_LOGS_CONFIG = {
  type: 'fetch-logs',
  deployId: '38v8rr36t4m5zszuxd',
};

// Helper function to create WebSocket connection
const createWebSocketConnection = (url, onMessage, onError, onClose) => {
  const ws = new WebSocket(url);

  ws.on('open', () => {
    console.log('WebSocket connection established');
  });

  ws.on('message', onMessage);

  ws.on('error', onError);

  ws.on('close', onClose);

  return ws;
};

// Tests for HTTP endpoints
describe('HTTP Endpoints', () => {
  describe('POST /analytics', () => {
    it('should store analytics data and return success message', async () => {
      try {
        const response = await axios.post('http://localhost:3000/analytics', MOCK_ANALYTICS_DATA);
        expect(response.status).toBe(200);
        expect(response.data.message).toBe('Analytics data stored successfully');
      } catch (error) {
        throw error;
      }
    });
  });

  describe('GET /get-project-id', () => {
    it('should fetch project ID successfully for given subdomain', async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/get-project-id?subDomain=${MOCK_SUBDOMAIN_DATA.subdomainId}`
        );
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('projectId');
      } catch (error) {
        throw error;
      }
    });
  });

  describe('POST /webhook', () => {
    it('should return a valid response', async () => {
      try {
        const response = await axios.post('http://localhost:3000/webhook', MOCK_WEBHOOK_DATA);
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('message');
      } catch (error) {
        console.error(error);
      }
    });
  });
});

// Tests for WebSocket connections
describe('WebSocket Connections', () => {
  describe('WebSocket Connection', () => {
    it('should establish a WebSocket connection and receive a message', (done) => {
      const ws = createWebSocketConnection(
        'ws://localhost:3000',
        (message) => {
          const sampleObject = {
            id: 1,
            name: 'John Doe',
            age: 30,
          };
          console.log(`Received message: ${message}`);
          expect(message.toString()).toBe(JSON.stringify(sampleObject));
          ws.close();
          done();
        },
        (error) => {
          console.error('WebSocket error:', error);
          done(error);
        },
        () => {
          console.log('WebSocket connection closed');
        }
      );
    });
  });

  describe('WS Request to Spin Up Container and Build Code', () => {
    it('should establish a WS connection, build containers, stream logs to Kafka, and upload to ClickHouseDB', (done) => {
      const ws = createWebSocketConnection(
        'ws://localhost:3000',
        (message) => {
          const parsedMessage = JSON.parse(message.toString());
          console.log('Received message from the WS about the deployment:', parsedMessage);
          expect(parsedMessage.type).toBe('deployment-success');
          expect(parsedMessage.message).toBe('Deployment completed successfully!');
          ws.close();
          done();
        },
        (error) => {
          console.error('WebSocket error:', error);
          done(error);
        },
        () => {
          console.log('WebSocket connection closed');
        }
      );

      ws.on('open', () => {
        ws.send(JSON.stringify(MOCK_BUILD_CONFIGS));
      });
    });

    it('should return a deployment error if the payload is invalid', (done) => {
      const ws = createWebSocketConnection(
        'ws://localhost:3000',
        (message) => {
          const parsedMessage = JSON.parse(message.toString());
          console.log('Received message from the WS about the deployment:', parsedMessage);
          expect(parsedMessage.type).toBe('error');
          expect(parsedMessage.message).toBe('Missing required fields: "githubUrl", "env", or "framework"');
          ws.close();
          done();
        },
        (error) => {
          console.error('WebSocket error:', error);
          done(error);
        },
        () => {
          console.log('WebSocket connection closed');
        }
      );

      ws.on('open', () => {
        ws.send(JSON.stringify(MOCK_INVALID_BUILD_CONFIGS));
      });
    });

    it('should fetch logs and return them for displaying on the frontend', (done) => {
      const ws = createWebSocketConnection(
        'ws://localhost:3000',
        (message) => {
          const parsedMessage = JSON.parse(message.toString());
          console.log('Received message from the WS about the logs:', parsedMessage);
          expect(parsedMessage.type).toBe('logs');
          expect(parsedMessage.message).toBe('Fetched logs successfully');
          ws.close();
          done();
        },
        (error) => {
          console.error('WebSocket error:', error);
          done(error);
        },
        () => {
          console.log('WebSocket connection closed');
        }
      );

      ws.on('open', () => {
        ws.send(JSON.stringify(MOCK_FETCH_LOGS_CONFIG));
      });
    });

    it('should return an error if the message type does not exist', (done) => {
      const ws = createWebSocketConnection(
        'ws://localhost:3000',
        (message) => {
          const parsedMessage = JSON.parse(message.toString());
          console.log('Received message from the WS about the error:', parsedMessage);
          expect(parsedMessage.type).toBe('error');
          expect(parsedMessage.message).toBe('Invalid message type');
          ws.close();
          done();
        },
        (error) => {
          console.error('WebSocket error:', error);
          done(error);
        },
        () => {
          console.log('WebSocket connection closed');
        }
      );

      ws.on('open', () => {
        ws.send(JSON.stringify({ type: 'invalid-type' }));
      });
    });
  });
});
