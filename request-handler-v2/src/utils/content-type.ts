export function getContentType(resolvedPath: string){
    const contentType = resolvedPath.endsWith(".html") ? "text/html" :
    resolvedPath.endsWith(".css") ? "text/css" :
    resolvedPath.endsWith(".js") ? "application/javascript" :
    resolvedPath.endsWith(".svg") ? "image/svg+xml" :
    resolvedPath.endsWith(".jpg") || resolvedPath.endsWith(".jpeg") ? "image/jpeg" :
    resolvedPath.endsWith(".png") ? "image/png" :
    resolvedPath.endsWith(".gif") ? "image/gif" :
    "application/octet-stream";
    

    return contentType;
}


