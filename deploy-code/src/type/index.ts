export interface uploadFileInterface {
    fileName: string,
    localFilePath: string, 
    generatedId:string
} 

export interface buildInterface {
    githubUrl:string,
     env: Record<string, string>,
     framework:SupportedFramework,
     deploy_id:string

}

export interface buildScriptInterface {
    githubUrl:string,
     env: Record<string, string>,
     framework:SupportedFramework,
     subdomainId:string,
}

export enum OutputFolder {
    DIST = 'dist',
    BUILD = 'build',
    OUT = 'out',
    NEXT = '.next',
    PUBLIC = 'public',
    TARGET = 'target',
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
  

