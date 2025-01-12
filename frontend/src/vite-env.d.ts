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

export interface buildCodeInterface {
  type: string;
  githubUrl: string;
  env: string[];
  framework:SupportedFramework,
}

export enum SupportedFramework {
  REACT = 'react',
  NEXTJS = 'nextjs',
  VUE = 'vue',
  ANGULAR = 'angular',
  SVELTE = 'svelte',
  GATSBY = 'gatsby',
  NUXT = 'nuxt',
  LARAVEL = 'laravel',
  EXPRESS = 'express',
}

export interface Deploy {
  repoUrl: string, 
  repoId?: number, 
  env:string[], 
  framework:SupportedFramework
}

export interface WebSocketContextType {
  ws: WebSocket | null
  isConnected: boolean
  sendMessage: (message: any) => void
}