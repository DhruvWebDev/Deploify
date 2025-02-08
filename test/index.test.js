const axios = require('axios');
const { describe, it } = require('node:test');
const assert = require('node:assert');
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
  type: 'build-project',
  githubUrl: 'https://github.com/hkirat/react-boilerplate',
  env: {},
  framework: 'react',
};

const MOCK_INVALID_BUILD_CONFIGS = {
  type: 'build-project',
  env: {},
  framework: 'react',
};

const MOCK_FETCH_LOGS_CONFIG = {
  type: 'fetch-logs',
  deployId: '38v8rr3bwcm622hauk',
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
  it('should store analytics data and return success message', async () => {
    try {
      const response = await axios.post('http://localhost:3000/analytics', MOCK_ANALYTICS_DATA);
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.data.message, 'Analytics data stored successfully');
    } catch (error) {
      console.error('Error in POST /analytics:', error);
      throw error;
    }
  });

  it('should fetch project ID successfully for given subdomain', async () => {
    try {
      const response = await axios.get(
        `http://localhost:3000/get-project-id?subDomain=${MOCK_SUBDOMAIN_DATA.subdomainId}`
      );
      assert.strictEqual(response.status, 200);
      assert.ok(response.data.projectId);
    } catch (error) {
      console.error('Error in GET /get-project-id:', error);
      throw error;
    }
  });

  it('should return a valid response for webhook', async () => {
    try {
      const response = await axios.post('http://localhost:3000/webhook', MOCK_WEBHOOK_DATA);
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.data.ref, 'refs/heads/main');
    } catch (error) {
      console.error('Error in POST /webhook:', error);
    }
  });
});

// Tests for WebSocket connections
describe('WebSocket Connections', () => {
  it('should establish a WS connection, build containers, stream logs to Kafka, and upload to ClickHouseDB', (done) => {
    const ws = createWebSocketConnection(
      'ws://localhost:3000',
      (message) => {
        const parsedMessage = JSON.parse(message.toString());
        console.log('Received message from the WS about the deployment:', parsedMessage);
        assert.strictEqual(parsedMessage.type, 'deployment-success');
        assert.strictEqual(parsedMessage.message, 'Deployment completed successfully!');
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
});

// Only run this describe block
describe.only('Request Handler Service', () => {
  it('It should handle the vite project request', async () => {
    try {
      const response = await axios.get('http://localhost:3001/vite-project');
      assert.strictEqual(response.status, 200);
      assert.ok(response.data.message);
    } catch (error) {
      console.error('Error in GET /vite-project:', error);
      throw error;
    }
  });

  it('It should handle the next project request', async () => {
    try {
      const response = await axios.get('http://localhost:3001/next-project');
      assert.strictEqual(response.status, 200);
      assert.ok(response.data.message);
    } catch (error) {
      console.error('Error in GET /next-project:', error);
      throw error;
    }
  });

  it('It should return a 404 error for an invalid subdomain', async () => {
    try {
      const response = await axios.get('http://localhost:3001/invalid-subdomain');
      assert.strictEqual(response.status, 404);
      assert.strictEqual(response.data.message, 'Not Found');
    } catch (error) {
      console.error('Error in GET /invalid-subdomain:', error);
      throw error;
    }
  });
});


//TODO'S IN TESTS
//HTTP Endpoints
//WS Endpoints
//Request-Handler-service
//Webhook-event-listener
