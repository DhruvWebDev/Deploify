import { createClient } from '@clickhouse/client' // or '@clickhouse/client-web'
import dotenv from "dotenv";
dotenv.config();
export async function getClickhouseClient(){
    const client = await createClient({
        url: `${process.env.CLICKHOUSE_HOST}`,
        database: 'default',
        })
    return client;
}