import { useState, useEffect } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Github, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { EnvVariablesInput } from "@/components/ui/env-variable-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type SupportedFramework = "next" | "react" | "vue" | "nuxt" | "svelte";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string;
}

interface Deploy {
  repoUrl: string;
  repoId?: number;
  env: Record<string, string>;
  framework: SupportedFramework;
}

// Create an Axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export function Deployment() {
  const [githubUrl, setGithubUrl] = useState("");
  const [env, setEnv] = useState<Record<string, string>>({});
  const [framework, setFramework] = useState<SupportedFramework | "">("");
  const [deployingRepoId, setDeployingRepoId] = useState<number | null>(null);
  const [deployLogs, setDeployLogs] = useState("");
  const [repos, setRepos] = useState<Repository[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [currentDeployId, setCurrentDeployId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check server connection
    const checkConnection = async () => {
      try {
        await api.get('/health');  // Assuming there's a health check endpoint
        setIsConnected(true);
      } catch (error) {
        setIsConnected(false);
        console.error("Connection to server failed:", error);
      }
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fetch user's repositories
    const fetchRepos = async () => {
      try {
        const response = await fetch("/api/github/repos");
        const data = await response.json();
        setRepos(data);
      } catch (error) {
        console.error("Failed to fetch repositories:", error);
        toast({
          title: "Error",
          description: "Failed to fetch your repositories. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchRepos();
  }, []);

  // Poll for deployment status
  useEffect(() => {
    if (currentDeployId && isConnected) {
      const fetchDeploymentStatus = async () => {
        try {
          const response = await api.get(`/deployments/${currentDeployId}/status`);
          const { status } = response.data;
          
          // Fetch the latest logs
          await fetchDeploymentLogs();
          
          // If deployment is complete (either successfully or failed)
          if (status === 'READY') {
            setDeployLogs(prev => prev + "\nDeployment successful!");
            toast({
              title: "Deployment Completed",
              description: "Your application has been deployed successfully!",
            });
            
            // Stop polling
            if (pollingInterval) {
              clearInterval(pollingInterval);
              setPollingInterval(null);
            }
            setDeployingRepoId(null);
          } else if (status === 'FAIL') {
            setDeployLogs(prev => prev + "\nDeployment failed!");
            toast({
              title: "Deployment Failed",
              description: "There was an error deploying your application.",
              variant: "destructive",
            });
            
            // Stop polling
            if (pollingInterval) {
              clearInterval(pollingInterval);
              setPollingInterval(null);
            }
            setDeployingRepoId(null);
          }
        } catch (error) {
          console.error("Failed to fetch deployment status:", error);
        }
      };
      
      // Start polling
      const interval = setInterval(fetchDeploymentStatus, 5000); // Poll every 5 seconds
      setPollingInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [currentDeployId, isConnected]);

  // Function to fetch deployment logs
  const fetchDeploymentLogs = async () => {
    if (!currentDeployId) return;
    
    try {
      const response = await api.get(`/deployments/${currentDeployId}/logs`);
      if (response.data.success && response.data.logs) {
        // Format and append logs
        const formattedLogs = response.data.logs.map((log) => log.log).join('\n');
        setDeployLogs(formattedLogs);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    }
  };

  const handleDeploy = async ({ repoUrl, repoId, env, framework }: Deploy) => {
    if (!isConnected) {
      toast({
        title: "Connection Error",
        description: "Not connected to deployment server. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    setDeployingRepoId(repoId || null);
    setDeployLogs("Starting deployment...\n");

    try {
      const response = await api.post('/projects/deploy', {
        githubUrl: repoUrl,
        env,
        framework,
      });
      
      if (response.data.success) {
        // Store the deployment ID for status polling
        setCurrentDeployId(response.data.deployId);
        
        toast({
          title: "Deployment Started",
          description: `Deploying ${repoUrl}`,
        });
      } else {
        toast({
          title: "Deployment Failed",
          description: response.data.message || "Failed to start deployment",
          variant: "destructive",
        });
        setDeployingRepoId(null);
      }
    } catch (error) {
      console.error("Deployment request failed:", error);
      toast({
        title: "Error",
        description: "Failed to start deployment. Please try again.",
        variant: "destructive",
      });
      setDeployingRepoId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8">
        {!isConnected && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              Not connected to deployment server. Attempting to reconnect...
            </AlertDescription>
          </Alert>
        )}
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">
              Deploy your GitHub Project
            </CardTitle>
            <CardDescription>
              Select a repository, framework, and set environment variables to
              deploy it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="github-url" className="text-sm font-medium">
                  GitHub Repository
                </label>
                <div className="flex gap-2">
                  <Input
                    id="github-url"
                    placeholder="https://github.com/username/repo"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                  />
                  <Button
                    onClick={() =>
                      (window.location.href =
                        "https://github.com/apps/deploify")
                    }
                  >
                    <Github className="mr-2 h-4 w-4" />
                    Connect More Repositories
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="framework" className="text-sm font-medium">
                  Framework
                </label>
                <Select
                  value={framework}
                  onValueChange={(value) =>
                    setFramework(value as SupportedFramework)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a framework" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="next">Next.js</SelectItem>
                    <SelectItem value="react">React</SelectItem>
                    <SelectItem value="vue">Vue</SelectItem>
                    <SelectItem value="nuxt">Nuxt</SelectItem>
                    <SelectItem value="svelte">Svelte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Environment Variables
                </label>
                <EnvVariablesInput env={env} setEnv={setEnv} />
              </div>
              <Button
                className="w-full bg-black hover:bg-gray-800 text-white"
                onClick={() =>
                  handleDeploy({
                    repoUrl: githubUrl,
                    env: env || {},
                    framework: (framework as SupportedFramework) || "next",
                  })
                }
                disabled={!githubUrl || !isConnected || !!deployingRepoId}
              >
                {deployingRepoId ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  "Deploy"
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                After deployment, you will receive a URL where your website is
                hosted.
              </p>
            </div>
          </CardContent>
        </Card>

        {repos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Repositories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {repos.map((repo) => (
                  <Card key={repo.id}>
                    <CardHeader>
                      <CardTitle>{repo.name}</CardTitle>
                      <CardDescription>{repo.full_name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() =>
                          handleDeploy({
                            repoUrl: repo.html_url,
                            repoId: repo.id,
                            env: env || {},
                            framework:
                              (framework as SupportedFramework) || "next",
                          })
                        }
                        disabled={deployingRepoId === repo.id || !isConnected}
                      >
                        {deployingRepoId === repo.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deploying...
                          </>
                        ) : (
                          "Deploy"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {deployLogs && (
          <Card>
            <CardHeader>
              <CardTitle>Deploy Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] rounded-md border">
                <div className="p-4 space-y-4">
                  <pre className="whitespace-pre-wrap font-mono text-sm">
                    {deployLogs}
                  </pre>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}