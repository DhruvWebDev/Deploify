import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { getMimeType } from './getMimeTypes';
import { supabase } from '../lib/supabase/supabase';
import {uploadFileInterface} from "../type/index";


  export const uploadFile = async ({ fileName, localFilePath, subdomainId }: uploadFileInterface) => {
    try {
    // Read the file from the local filesystem
    const fileContent = fs.readFileSync(localFilePath);

    // Get MIME type from the file extension
    const mimeType = getMimeType(localFilePath); // Custom function to detect MIME type

    // Specify the bucket name and the file path within the bucket
    const bucketName = 'file'; // Replace with your bucket name
    const filePath = `${subdomainId}/${fileName}`

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