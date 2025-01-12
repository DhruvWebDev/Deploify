import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();
export const publisher = createClient({
    url: process.env.DATABASE_URL,
});