import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { WebSocketProvider } from '@/context/web-socket.tsx'
import { Toaster } from "./components/ui/toaster"

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WebSocketProvider>
      <App />
      <Toaster />
    </WebSocketProvider>
  </React.StrictMode>,
)

