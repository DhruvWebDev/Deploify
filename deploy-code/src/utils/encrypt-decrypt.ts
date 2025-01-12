import CryptoJS from "crypto-js";
import dotenv from "dotenv"
dotenv.config();
const SECRET_KEY = "your-secret-key"; // Use a strong, unique key

// Encrypt the token
export const encryptToken = (token:string) => {
  return CryptoJS.AES.encrypt(token, SECRET_KEY).toString();
};

// Decrypt the token
export const decryptToken = (encryptedToken:string) => {
  const bytes = CryptoJS.AES.decrypt(encryptedToken, process.env.SECRET_KEY as string);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// // Example Usage
// const token = "your-access-token";
// const encryptedToken = encryptToken(token);
// console.log("Encrypted Token:", encryptedToken);

// const decryptedToken = decryptToken(encryptedToken);
// console.log("Decrypted Token:", decryptedToken);
