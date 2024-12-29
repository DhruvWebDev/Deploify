// utils/axiosInstance.js

import axios from 'axios';

export const BASE_URL:string = 'https://api.github.com';  // GitHub API base URL

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,  // Optional: Set timeout for requests
});

// Define the getRepoAPI function
const getRepoAPI = (username:string) => {
  return axiosInstance.get(`/users/${username}/repos`);
};

export default axiosInstance;
export { getRepoAPI };
