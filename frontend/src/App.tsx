"use client"

import { useState } from "react"
import { Search, GitBranch, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"

import {createClient} from "redis";
const subscriber = createClient();
subscriber.connect();

//Just need to get the status of the deployment and the id as well as github url of the deployment to showcase the link to the user from the redis queue by getting the specific id that matches with their github_url 
interface Repository {
  id: number
  name: string
  description: string
  html_url: string
  stargazers_count: number
  language: string
}

export default function DeployPage() {
  const [githubUrl, setGithubUrl] = useState("")
  const [username, setUsername] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [deployingRepoId, setDeployingRepoId] = useState<number | null>(null)

  const fetchRepositories = async (username: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`https://api.github.com/users/${username}/repos`)
      if (!response.ok) {
        throw new Error('Failed to fetch repositories')
      }
      const data = await response.json()
      setRepositories(data)
    } catch (error) {
      toast.error("Failed to fetch repositories. Please try again.")
      console.error("Error fetching repositories:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDeploy = async (repoUrl: string, repoId?: number) => {
    if (repoId) {
      setDeployingRepoId(repoId)
    }
    
    try {
      // Here you would implement the actual deployment logic
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulated deployment
      toast.success("Deployment started successfully!")
    } catch (error) {
      toast.error("Failed to start deployment. Please try again.")
    } finally {
      setDeployingRepoId(null)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="grid gap-8">
        {/* Deploy Section */}
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Deploy your GitHub Project</CardTitle>
            <CardDescription>
              Enter the URL of your GitHub project to deploy it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="github-url" className="text-sm font-medium">
                  GitHub URL
                </label>
                <Input
                  id="github-url"
                  placeholder="https://github.com/username/repo"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
              </div>
              <Button 
                className="w-full bg-black hover:bg-gray-800 text-white" 
                onClick={() => handleDeploy(githubUrl)}
                disabled={!githubUrl}
              >
                Deploy
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                After deployment, you will receive a URL where your website is hosted.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Repository Search Section */}
        <Card>
          <CardHeader>
            <CardTitle>Your GitHub Repositories</CardTitle>
            <CardDescription>
              Enter your GitHub username to see your repositories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter GitHub username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <Button 
                  onClick={() => fetchRepositories(username)}
                  disabled={!username || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading
                    </>
                  ) : (
                    'Fetch Repos'
                  )}
                </Button>
              </div>
              
              {repositories.length > 0 && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search repositories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  
                  <ScrollArea className="h-[400px] rounded-md border">
                    <div className="p-4 space-y-4">
                      {filteredRepositories.map((repo) => (
                        <Card key={repo.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <GitBranch className="h-4 w-4" />
                                  <h3 className="font-medium">{repo.name}</h3>
                                </div>
                                {repo.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {repo.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  {repo.language && (
                                    <span>{repo.language}</span>
                                  )}
                                  <span>⭐ {repo.stargazers_count}</span>
                                </div>
                              </div>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleDeploy(repo.html_url, repo.id)}
                                disabled={deployingRepoId === repo.id}
                              >
                                {deployingRepoId === repo.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deploying...
                                  </>
                                ) : (
                                  'Deploy'
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}