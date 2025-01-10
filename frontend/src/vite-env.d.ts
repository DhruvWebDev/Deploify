/// <reference types="vite/client" />


export interface Repository {
  id: number;
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  language: string;
}

export interface BuildLogs  {
    logs: string;
    time:string
}