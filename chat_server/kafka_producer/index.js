import { Kafka, logLevel } from "kafkajs";
import dotenv from "dotenv";

dotenv.config();

const kafka = new Kafka({
  clientId: "chat-server",
  brokers: [process.env.KAFKA_BROKER],
  logLevel: logLevel.ERROR,
});

export const producer = kafka.producer();
export const chat_consumer = kafka.consumer({
  groupId: "real-time-chat-consume" + process.env.PORT,
});
export const kafkaInit = async () => {
  try {
    const admin = kafka.admin();

    await admin.connect();

    await admin.createTopics({
      topics: [
        {
          topic: "chat",
        },
        {
          topic: "ACK",
        },
        {
          topic: "seen-msg",
        },
        {
          topic: "seen-msg-db-write",
        },
        {
          topic: "user-online-status",
        },
        {
          topic: "check-user-online-status",
        },
      ],
    });
    await admin.disconnect();
    await producer.connect();
    await chat_consumer.connect();

    await chat_consumer.subscribe({
      topics: [
        "chat",
        "ACK",
        "seen-msg",
        "seen-msg-db-write",
        "user-online-status",
        "check-user-online-status",
      ],
    });

  } catch (error) {
    throw error;
  }
};
