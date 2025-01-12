import fs from "fs";
import path from "path";

export const getAllFiles = (folderPath: string) => {
    let response: string[] = [];

    const allFilesAndFolders = fs.readdirSync(folderPath);
    allFilesAndFolders.forEach(file => {
        const fullFilePath = path.join(folderPath, file);
        if (fs.statSync(fullFilePath).isDirectory()) {
            response = response.concat(getAllFiles(fullFilePath));
        } else {
            response.push(fullFilePath);
        }
    });
    return response;
}

// const fullFilePath = path.join(__dirname,"abc"); // Make sure folderPath is correctly formatted


// const output = getAllFiles(fullFilePath);

// console.log(output)

/**
 * The getAllFiles function recursively searches for files inside the specified directory and its subdirectories.
   It returns an array of absolute file paths.
   The function uses fs.readdirSync() to read the contents of a directory and fs.statSync() to check if an item is a file or directory.
   If it's a directory, it calls itself recursively; if it's a file, it adds the file's path to the result array.
   Finally, the script logs the list of all files inside the specified directory (abc) to the console.
 */