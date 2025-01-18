import { Button } from "@/components/ui/button";
import { Github } from 'lucide-react';

export function GitHubAuth() {
  const handleGitHubAuth = () => {
    window.location.href = 'https://github.com/apps/deploify';
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-6 text-center">
      <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/20">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6 text-white"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M7 7h10" />
            <path d="M7 12h10" />
            <path d="M7 17h10" />
          </svg>
        </div>
      </div>
      <h2 className="text-2xl font-bold">Connect with GitHub</h2>
      <p className="text-muted-foreground max-w-sm">
        Install the Deploify GitHub App to automatically deploy your repositories
      </p>
      <Button
        size="lg"
        className="bg-[#24292F] hover:bg-[#24292F]/90 text-white"
        onClick={handleGitHubAuth}
      >
        <Github className="mr-2 h-5 w-5" />
        Install GitHub App
      </Button>
    </div>
  );
}

