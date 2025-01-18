const { Kafka } = require('kafkajs');
const fs = require('fs');
const path = require("path");
const dotenv = require('dotenv');
dotenv.config();

export function createKafkaClient(deploy_id?: string) {
    if(deploy_id) {
        const kafka = new Kafka({
            clientId: `build-logs-client-${deploy_id}`,
            brokers: [`${process.env.KAFKA_BROKER_URL}`],
            sasl: {
                mechanism: 'plain',
                username: `${process.env.KAFKA_USERNAME}`,
                password: `${process.env.KAFKA_PASSWORD}`,
            },
            ssl: {
                ca: [process.env.KAFKA_CA_CERTIFICATE], // Pass CA directly as a string from environment variable
            },
        });
        return kafka;
    
    } else {
        const kafka = new Kafka({
            clientId: `api-server`,
            brokers: [`${process.env.KAFKA_BROKER_URL}`],
            sasl: {
                mechanism: 'plain',
                username: `${process.env.KAFKA_USERNAME}`,
                password: `${process.env.KAFKA_PASSWORD}`,
            },
            ssl: {
                ca: [process.env.KAFKA_CA_CERTIFICATE], // Pass CA directly here as well
            },
        });
        return kafka;
    }
}
