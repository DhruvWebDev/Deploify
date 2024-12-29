// src/app/api/git-repos/route.ts

import { getRepoAPI } from '@/axios/git-repo-api';
import axios from 'axios';

export async function POST(req: Request) {
  try {
    // Get the username from the request body
    const { username } = await req.json();
    
    // Validate if the username is provided
    if (!username) {
      return new Response(JSON.stringify({ error: 'Username is required' }), { status: 400 });
    }

    // GitHub API URL for fetching user repositories
    // Make a request to GitHub API to fetch repositories
    const response = await getRepoAPI(username)
    
    // Get the first 5 repositories
    const repos = response.data.slice(0, 5);

    // Return the repositories as a JSON response
    return new Response(JSON.stringify(repos), { status: 200 });
  } catch (error) {
    console.error('Error fetching repositories from GitHub:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch repositories' }), { status: 500 });
  }
}
