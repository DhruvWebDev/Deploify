// pages/index.js
'use client'
import axios from 'axios';
import { useEffect, useState } from 'react';

export default function Home() {
  const [repos, setRepos] = useState([]);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('DhruvWebDev');  // Replace with dynamic username if needed

  const fetchRepos = async () => {
    try {
      const response = await axios.post('/api/git-repos', { username });  // Send username in the request body

      // Check if the response is successful
      if (response.status !== 200) {
        throw new Error('Repositories not found');
      }

      setRepos(response.data);  // Set the response data to the state
    } catch (err) {
      setError(err.message);  // Set the error if there is one
    }
  };

  useEffect(() => {
    fetchRepos();
  }, [username]);

  if (error) {
    return <div style={{ color: 'red', fontSize: '18px', textAlign: 'center' }}>Error: {error}</div>;
  }

  if (repos.length === 0) {
    return <div style={{ textAlign: 'center', fontSize: '20px' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>Top 5 Repositories</h1>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {repos.map((repo) => (
          <li key={repo?.id} style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
            <p style={{ fontSize: '18px', fontWeight: 'bold' }}>Name: {repo?.name}</p>
            <p style={{ fontSize: '16px', color: '#555' }}>Description: {repo?.description || 'No description'}</p>
            <p>
              URL: <a href={repo?.html_url} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff' }}>{repo?.html_url}</a>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
