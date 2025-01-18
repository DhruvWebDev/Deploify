import { PrismaClient } from "@prisma/client";
import { createKafkaClient } from "../lib/kafka/client";
import { getClickhouseClient } from "../lib/clickhouse/client";
import kleur from "kleur"; // Using kleur instead of chalk
import moment from "moment";
import uniqid from "uniqid";

const prisma = new PrismaClient();
const client = getClickhouseClient();

enum LogType {
  INFO,
  SUCCESS,
  WARNING,
  ERROR,
}

function getLogType(logData: string): LogType {
  if (logData.includes("error")) return LogType.ERROR;
  if (logData.includes("success")) return LogType.SUCCESS;
  if (logData.includes("warning")) return LogType.WARNING;
  return LogType.INFO;
}

function getLogColor(logType: LogType): (text: string) => string {
  switch (logType) {
    case LogType.ERROR:
      return kleur.red;
    case LogType.SUCCESS:
      return kleur.green;
    case LogType.WARNING:
      return kleur.yellow;
    default:
      return kleur.blue;
  }
}

export function formatLog(logData: string): string {
  const timestamp = moment().format("YYYY-MM-DD HH:mm:ss");
  const logType = getLogType(logData);
  const logColor = getLogColor(logType);
  return `${logColor(`[${LogType[logType]}]`)} ${timestamp} - ${kleur.white(logData)}`;
}

export async function sendLogToKafka(logMessage: string, deploy_id: string) {
  try {
    console.log("Sending log to Kafka:", { logMessage, deploy_id });
    const kafka = createKafkaClient(deploy_id);
    const producer = kafka.producer();

    await producer.connect();
    console.log("Kafka producer connected");

    const formattedLog = formatLog(logMessage);
    console.log("Formatted log:", formattedLog);

    await producer.send({
      topic: "build-logs",
      messages: [
        {
          value: JSON.stringify({
            deploy_id,
            log: formattedLog,
          }),
        },
      ],
    });
    console.log("Log sent to Kafka");

    await producer.disconnect();
    console.log("Kafka producer disconnected");
  } catch (error) {
    console.error("Error sending log to Kafka:", error);
  }
}

export async function initialKafka(deployId: string): Promise<void> {
  try {
    console.log("Initializing Kafka consumer for deployId:", deployId);
    const kafka = createKafkaClient();
    const consumer = kafka.consumer({ groupId: `build-logs-consumer` });

    await consumer.connect();
    console.log("Kafka consumer connected");

    await consumer.subscribe({ topic: "build-logs", fromBeginning: true });
    console.log("Subscribed to topic: build-logs");

    await consumer.run({
      eachBatch: async ({ batch, resolveOffset, commitOffsetsIfNecessary, heartbeat }:any) => {
        console.log(`Received ${batch.messages.length} messages in batch`);

        for (const message of batch.messages) {
          if (!message.value) continue;
          const { deploy_id, log } = JSON.parse(message.value.toString());
          console.log("Processing message:", { deploy_id, log });

          try {
            const resolvedClient = await client;
            console.log("Clickhouse client resolved");

            const { query_id } = await resolvedClient.insert({
              table: "log_events",
              values: [{ event_id:` deploy_id-${uniqid()}`, deployment_id: deploy_id, log }],
              format: "JSONEachRow",
            });
            console.log("Log inserted into Clickhouse with query_id:", query_id);

            resolveOffset(message.offset);
            await commitOffsetsIfNecessary();
            await heartbeat();
            console.log("Offset committed and heartbeat sent");
          } catch (err) {
            console.error("Error processing message:", err);
          }
        }
      },
    });
    console.log("Kafka consumer running");
  } catch (error) {
    console.error("Error initializing Kafka consumer:", error);
  }
}
