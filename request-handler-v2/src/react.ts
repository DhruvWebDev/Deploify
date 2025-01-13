import express from "express";
import { createClient } from '@supabase/supabase-js'; 
import { supabase } from "./utils/supabase/client";
import { getContentType } from "./utils/content-type";
const PORT = 8080;
const app = express();


// Route to handle all incoming requests
app.get("/*", async (req, res) => {
    const hostName = req.headers.host;
    console.log("Host Name:", hostName);

    const id = hostName.split(".")[0]; // Extract the ID from the subdomain, e.g., 1234.localhost -> 1234
    const filePath = req.path.substring(1); // Strip the leading '/' from the path
    console.log("ID:", id, "Requested File Path:", filePath);

    // Build the file path for Supabase storage (e.g., "1234/index.html")
    const fileKey = `${id}/${filePath || "index.html"}`; // Default to 'index.html' if path is empty
    console.log("Supabase File Key:", fileKey);

    try {
        // Fetch the file from Supabase storage
        const { data, error } = await supabase.storage.from('file').download(fileKey);
        console.log(data, "data");

        if (error) {
            console.error('Error downloading file:', error);
            return res.status(404).send('File not found');
        }

        
        // Determine the file type based on the extension

        const type = getContentType(filePath);
        // Set the appropriate content type
        res.set("Content-Type",type);

        // Log the content (only for debugging purposes)
        // Send the file content as the response
        res.send(data);

    } catch (err) {
        console.error('Error fetching file:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Start the server and log the message when it's running
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});