const axios = require('axios');
const { describe, it } = require('node:test');
const assert = require('node:assert');

const BASE_URL = 'http://localhost:3000/api';

const MOCK_DEPLOY_DATA = {
  githubUrl: 'https://github.com/example/repo',
  env: {},
  framework: 'react',
};

describe('Deployment API', () => {
  let deployId = '';

  it('should start the deployment process successfully', async () => {
    try {
      const response = await axios.post(`${BASE_URL}/projects/deploy`, MOCK_DEPLOY_DATA);
      assert.strictEqual(response.status, 202);
      assert.strictEqual(response.data.success, true);
      assert.ok(response.data.deployId);
      deployId = response.data.deployId;
    } catch (error) {
      console.error('Error in POST /projects/deploy:', error);
      throw error;
    }
  });

  it('should return the deployment status', async () => {
    try {
      const response = await axios.get(`${BASE_URL}/deployments/${deployId}/status`);
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.data.success, true);
      assert.ok(response.data.status);
    } catch (error) {
      console.error('Error in GET /deployments/:deployId/status:', error);
      throw error;
    }
  });

  it('should return logs for a deployment', async () => {
    try {
      const response = await axios.get(`${BASE_URL}/deployments/${deployId}/logs`);
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.data.success, true);
      assert.ok(response.data.logs);
    } catch (error) {
      console.error('Error in GET /deployments/:deployId/logs:', error);
      throw error;
    }
  });
});
