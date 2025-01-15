const { Kafka } = require('kafkajs');
const fs = require('fs');
const path = require("path")
const dotenv = require('dotenv');
dotenv.config();

export function createKafkaClient(deploy_id: string) {
    const kafka = new Kafka({
        clientId: `build-logs-client-${deploy_id}`,
        brokers: [`${process.env.KAFKA_BROKER_URL}`],
        sasl: {
            mechanism: 'plain',
            username: `${process.env.KAFKA_USERNAME}`,
            password: `${process.env.KAFKA_PASSWORD}`,
        },
        ssl: {
            ca: [fs.readFileSync(path.resolve(__dirname, 'ca.pem'), 'utf-8')],
        },
    });
    return kafka;
}
