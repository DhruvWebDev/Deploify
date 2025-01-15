import { PrismaClient } from "@prisma/client";
import { createKafkaClient } from "../lib/kafka/client";
import { getClickhouseClient } from "../lib/clickhouse/client";
import chalk from 'chalk'; // Library for coloring logs
import { Kafka } from 'kafkajs';
import moment from 'moment'; // Library for timestamp formatting
import { v4 as uuidv4 } from 'uuid';


const prisma = new PrismaClient();
const client = getClickhouseClient();

export function formatLog(logData:string) {
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss'); // Timestamp in readable format
    const formattedLog = {
        timestamp,
        logMessage: logData,
    };
    
    // Adding colors for different log types (info, error, success, etc.)
    if (logData.includes('error')) {
        return `${chalk.red(`[ERROR]`)} ${timestamp} - ${chalk.white(logData)}`;
    } else if (logData.includes('success')) {
        return `${chalk.green(`[SUCCESS]`)} ${timestamp} - ${chalk.white(logData)}`;
    } else if (logData.includes('warning')) {
        return `${chalk.yellow(`[WARNING]`)} ${timestamp} - ${chalk.white(logData)}`;
    } else {
        return `${chalk.blue(`[INFO]`)} ${timestamp} - ${chalk.white(logData)}`;
    }
}
export async function sendLogToKafka(logMessage: string, deploy_id: string) {
    const kafka = createKafkaClient(deploy_id);
    const producer = kafka.producer();

    await producer.connect();
    const formattedLog = formatLog(logMessage);

    await producer.send({
        topic: 'build-logs',
        messages: [
            {
                value: JSON.stringify({
                    deploy_id,
                    log: formattedLog,
                }),
            },
        ],
    });

    await producer.disconnect();
}


export async function initialKafka(deployId: string): Promise<void> {
    const kafka = createKafkaClient(deployId);
    const consumer = kafka.consumer({ groupId: `build-logs-consumer-${deployId}` });

    await consumer.connect();
    await consumer.subscribe({ topic: 'build-logs', fromBeginning: true });

    await consumer.run({

        eachBatch: async function ({ batch, heartbeat, commitOffsetsIfNecessary, resolveOffset }) {

            const messages = batch.messages;
            console.log(`Recv. ${messages.length} messages..`)
            for (const message of messages) {
                if (!message.value) continue;
                const stringMessage = message.value.toString()
                const {deploy_id, log } = JSON.parse(stringMessage)
                console.log({ log,deploy_id })
                try {
                    const resolvedClient = await client;
                    const { query_id } = await resolvedClient.insert({
                        table: 'log_events',
                        values: [{ event_id: uuidv4(), deployment_id: deploy_id, log }],
                        format: 'JSONEachRow'
                    })
                    console.log(query_id)
                    resolveOffset(message.offset)
                    await commitOffsetsIfNecessary(message.offset)
                    await heartbeat()
                } catch (err) {
                    console.log(err)
                }

            }
        }
    })
}

