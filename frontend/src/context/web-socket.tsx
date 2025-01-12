'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { toast } from "@/hooks/use-toast"
import { WebSocketContextType } from '@/vite-env'



const WebSocketContext = createContext<WebSocketContextType>({
  ws: null,
  isConnected: false,
  sendMessage: () => {},
})

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    const ws = new WebSocket('ws://localhost:3000')

    ws.onopen = () => {
      console.log('WebSocket Connected')
      setIsConnected(true)
      toast({
        title: "Connected to server",
        description: "Ready to deploy projects",
      })
    }

    ws.onclose = () => {
      console.log('WebSocket Disconnected')
      setIsConnected(false)
      toast({
        title: "Disconnected from server",
        description: "Attempting to reconnect...",
        variant: "destructive",
      })
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000)
    }

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error)
      toast({
        title: "Connection Error",
        description: "Failed to connect to deployment server",
        variant: "destructive",
      })
    }

    wsRef.current = ws
  }

  useEffect(() => {
    connectWebSocket()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      toast({
        title: "Connection Error",
        description: "Not connected to deployment server. Attempting to reconnect...",
        variant: "destructive",
      })
      connectWebSocket()
    }
  }

  return (
    <WebSocketContext.Provider value={{ ws: wsRef.current, isConnected, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export const useWebSocket = () => useContext(WebSocketContext)

