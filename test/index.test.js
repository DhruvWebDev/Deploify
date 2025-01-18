const axios = require('axios');
const { describe } = require('node:test');
const WebSocket = require("ws")
describe('POST /analytics', () => {
  it('should store analytics data and return success message', async () => {
    // Mock analytics data
    const mockAnalyticsData = {
      projectId: '38v8rr36t4m5zszuxd',
      page: '/test-page',
    };

    try {
      // Send a POST request with mock data
      const response = await axios.post('http://localhost:3000/analytics', mockAnalyticsData);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.data.message).toBe('Analytics data stored successfully');
    } catch (error) {
      // Handle potential errors
      throw error;
    }
  });
});

describe('GET /get-project-id', () => {
    it('should fetch project ID successfully for given subdomain', async () => {
      // Mock subdomain data
      const mockData = {
        subdomainId: "scarce-brown-application",
      };
  
      try {
        // Send a GET request with subdomain query parameter
        const response = await axios.get(`http://localhost:3000/get-project-id?subDomain=${mockData.subdomainId}`);
        
        // Assertions
        expect(response.status).toBe(200);
        // Changed this to check for projectId in response since that's what your endpoint returns
        expect(response.data).toHaveProperty('projectId');
      } catch (error) {
        throw error;
      }
    });
  });


//   describe('GET /auth/callback', () => {
//     it('should return a valid JWT token', async () => {
//         try {
            
//         } catch (error) {
//             console.error(error)
//         }

//     })
//   })

  describe("POST /webhook", () => {
    it("should return a valid response", async () => {
        try {
            const mockData = {
                "ref": "refs/heads/main"
                };
                const response = await axios.post('http://localhost:3000/webhook', mockData);
                expect(response.status).toBe(200);
                expect(response.data).toHaveProperty('message');
            }catch(error){
                console.error(error)
            }
  })
  })


  describe('WebSocket Connection', () => {
    it('should establish a WebSocket connection and receive a message', (done) => {
      const ws = new WebSocket('ws://localhost:3000');
  
      ws.on('open', () => {
        console.log('WebSocket connection established');
        // ws.send('Hello Server');
      });
  
      ws.on('message', (message) => {
        const samppleObject = {
            "id": 1,
            "name": "John Doe",
            "age": 30
          }
        console.log(`Received message: ${message}`);
        expect(message.toString()).toBe(JSON.stringify(samppleObject)); // Adjust this based on your server's response
        ws.close();
        done();
      });
  
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        done(error);
      });
  
      ws.on('close', () => {
        console.log('WebSocket connection closed');
      });
    });
  });