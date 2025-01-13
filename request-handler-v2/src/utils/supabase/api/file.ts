// Utility function to fetch a file from Supabase
export const fetchFileFromSupabase = async (bucket:string, fileKey:string) => {
    const { data, error } = await supabase.storage.from(bucket).download(fileKey);
    if (error) {
      console.error(`Error downloading file: ${fileKey}`, error);
      throw new Error("File not found");
    }
    return data;
  };