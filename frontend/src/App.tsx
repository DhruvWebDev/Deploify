import { useState, useEffect } from "react"
import { useWebSocket } from "./context/web-socket"
import { GitHubAuth } from "./components/ui/github-auth"
import { Deployment } from "./components/ui/deployment"
import { parse } from "cookie"

function App() {
  const { isConnected } = useWebSocket()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check for authentication status
    // This is a placeholder. Replace with your actual authentication check
    const checkAuth = async () => {
      // Simulating an API call to check auth status
          const getAuthToken = () => {
      const cookies = parse(document.cookie)
      return cookies._access_token || null
    }

    const token = getAuthToken()
    if (token) {
      setIsAuthenticated(true)
    }
    }

    checkAuth()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {!isAuthenticated ? (
        <GitHubAuth />
      ) : (
        <Deployment isConnected={isConnected} />
      )}
    </div>
  )
}

export default App