import { Kafka } from "kafkajs";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
// const kafka = new Kafka({
//   clientId: "chat-producer",

//   brokers: [process.env.KAFKA_BROKER],
//   ssl: {
//     ca: [fs.readFileSync(path.resolve("./ca.pem"), "utf-8")],
//   },
//   sasl: {
//     username: "avnadmin",
//     password: "AVNS_bnqqmTwAqTaBAm3sHq6",
//     mechanism: "plain",
//   },
// });
dotenv.config();
console.log("process.env.KAFKA_BROKER", process.env.KAFKA_BROKER);
const kafka = new Kafka({
  clientId: "chat-server",
  brokers: [process.env.KAFKA_BROKER],
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
      ],
    });
    await admin.disconnect();
    await producer.connect();
    await chat_consumer.connect();
    console.log("\nprod con connected\n\n");
    await chat_consumer.subscribe({ topics: ["chat", "ACK","seen-msg"] });
  } catch (error) {
    throw error;
  }
};
