import express from "express";
import { supabase } from "./utils/supabase/client";
import { getContentType } from "./utils/content-type";
import { fetchFileFromSupabase } from "./utils/supabase/api/file";


const PORT = 3002;
const app = express();


    
// Route to handle Next.js requests
app.get("/*", async (req, res) => {
  const hostName = req.headers.host;
  console.log("Host Name:", hostName);

  const id = hostName.split(".")[0]; // Extract the ID from the subdomain
  const requestedPath = req.path; // Path from the request
  console.log("ID:", id, "Requested Path:", requestedPath);

  try {
    // Step 1: Fetch `app-path-manifest.json`
    const manifestKey = `${id}/.next/server/app-paths-manifest.json`;
    const manifestData = await fetchFileFromSupabase("file", manifestKey);
    const manifest = JSON.parse(await manifestData.text());

    // Step 2: Map the requested path to a file using the manifest
    const resolvedPath = manifest[requestedPath] || manifest[`${requestedPath}/page`] || manifest["/page"];
    if (!resolvedPath) {
      console.error("Path not found in manifest:", requestedPath);
      return res.status(404).send("Page not found");
    }

    console.log("Resolved Path:", resolvedPath);

    // Step 3: Fetch the resolved file
    const fileKey = `${id}/.next/${resolvedPath}`;
    const fileData = await fetchFileFromSupabase("file", fileKey);

    // Step 4: Determine the content type
    const contentType = getContentType(resolvedPath)
    // Step 5: Serve the file
    res.set("Content-Type", contentType);
    res.send(fileData);

  } catch (err) {
    console.error("Error processing request:", err);
    res.status(500).send("Internal Server Error");
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
