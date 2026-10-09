import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import { Kafka } from "kafkajs";

const TOPIC_NAME = "zap-events";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const client = new PrismaClient({ adapter });

const kafka = new Kafka({
    clientId: 'outbox-processor',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

async function main() {
    const producer = kafka.producer();
    await producer.connect();

    while (1) {
        const pendingRows = await client.zapRunOutbox.findMany({
            where: {},
            take: 10,
        });

        if (pendingRows.length > 0) {
            await producer.send({
                topic: TOPIC_NAME,
                messages: pendingRows.map(r => ({
                    value: r.zapRunId
                }))
            });

            await client.zapRunOutbox.deleteMany({
                where: {
                    id: {
                        in: pendingRows.map(x => x.id)
                    }
                }
            });
        }

        await new Promise(r => setTimeout(r, 3000));
    }
}

main();