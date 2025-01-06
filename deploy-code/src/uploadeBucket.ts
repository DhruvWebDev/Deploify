import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';


    const supabaseUrl = "https://prbhqalytjobgefpqicz.supabase.co";
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByYmhxYWx5dGpvYmdlZnBxaWN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0NTk5NzcsImV4cCI6MjA1MTAzNTk3N30.-ztObVrO-bX28IybZ2-W4sCQl6sW1u9w3QpdRLzJVTo"; // Replace with your actual Supabase key


// Upload file to Supabase storage and save metadata in PostgreSQL
export const uploadFile = async (fileName: string, localFilePath: string, generatedId:any) => {
   const supabase = createClient(supabaseUrl, supabaseKey);
   
  try {
    // Read the file from the local filesystem
    const fileContent = fs.readFileSync(localFilePath);

    // Get MIME type from the file extension
    const mimeType = getMimeType(localFilePath); // Custom function to detect MIME type

    // Specify the bucket name and the file path within the bucket
    const bucketName = 'file'; // Replace with your bucket name
    const filePath = `${generatedId}/${fileName}`

    // Upload the file to Supabase storage
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .upload(filePath, fileContent, {
        cacheControl: '3600',
        upsert: true, // Set to true if you want to overwrite an existing file with the same name
        contentType: mimeType,
      });

    if (error) {
      throw new Error(error.message);
    }

    console.log('File uploaded successfully:', data);
  } catch (error) {
    console.error('Error uploading file:', error);
  }
};

// Function to get MIME type based on file extension
const getMimeType = (filePath: string): string => {
  const extname = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    // Add other MIME types as needed
  };
  return mimeTypes[extname] || 'application/octet-stream'; // Default to binary
};
