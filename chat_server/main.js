import { createServer } from "http";
import { Server as SocketIO } from "socket.io";
import Redis from "ioredis";
import dotenv from "dotenv";
import cluster from "cluster";
import { cpus } from "os";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import { decodeJwt } from "./JWT.js";
import {
  chat_consumer,
  kafkaInit,
  producer as kafkaProducer,
} from "./kafka_producer/index.js";
dotenv.config();

const numCPUs = cpus().length;

const corsOptions = {
  methods: "GET,POST",
  credentials: true,
  origin: process.env.CHAT_UI_HOST,
};

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork({ PORT: parseInt(process.env.PORT) + i });
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  // server
  const app = express();

  const httpServer = createServer(app);
  app.use(cookieParser());
  app.use(cors(corsOptions));
  app.use(express.json());

  app.get("/", (req, res) => {
    res.status(200).send("ChAt SERVER");
  });

  // Socket
  const io = new SocketIO(httpServer, {
    cors: {
      origin: process.env.CHAT_UI_HOST,
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
      credentials: true,
    },
  });

  //  Socket Ids
  const socketIds = new Map();

  // Kafka Producer
  try {
    await kafkaInit();
    console.log("\nKafka Initiated  chat server...\n");
  } catch (error) {
    console.log("\nKafka Init Error: \n", error);
  }

  //? Handle Socket Connection

  io.on("connection", (socket) => {
    socket.on("join-chat", ({ userId }) => {
      console.log("++++", userId);

      socketIds.set(userId, socket.id);
      console.log("socketIds", socketIds);
      socket.userId = userId;
      //   const _to_join = following.map((id) => "base:" + id);
      //   socket.join(_to_join);
      //   console.log("joined", _to_join.join(","));
    });
    socket.on("new-msg", (message_packet) => {
      console.log("first", message_packet);

      kafkaProducer
        .send({
          topic: "chat",
          messages: [{ value: JSON.stringify(message_packet) }],
        })
        .then((it) => {
          console.log("it", it);
        });
    });
    socket.on("disconnect", () => {
      console.log("Client disconnected", socket.userId);
      socketIds.delete(socket.userId);
    });
  });

  await chat_consumer.run({
    eachMessage: async ({ topic: channel, message: rawMessage }) => {
      const message = rawMessage.value;
      console.log(" new chat", channel);
      // bulk insert payload => batch.messages.map((it) => JSON.parse(it.value))
      try {
        if (channel == "ACK") {
          const ack_packet = JSON.parse(message);
          const { userId, message_id, level, conversation_id } = ack_packet;
          const messager_socket_id = socketIds.get(userId);
          if (messager_socket_id) {
            io.to(messager_socket_id).emit("acknowledgment", {
              level,
              message_id,
              conversation_id,
            });
          }
        } else {
          const message_packet = JSON.parse(message);
          const { receiverName } = message_packet;
          let _status = "offline";
          const destination_socket_id = socketIds.get(receiverName);
          console.log("des", destination_socket_id);
          if (destination_socket_id) {
            _status = "sent";
            io.to(destination_socket_id).emit("new-message", {
              message: [message_packet],
            });
            acknowledgment(
              message_packet.senderName,
              message_packet.id,
              message_packet.conversation_id,
              "sent"
            );
          } else {
            // acknowledgment(message_packet.senderName, message_packet.id, "offline");
          }
        }
        resolveOffset(batch.lastOffset);
        await heartbeat();
      } catch (error) {}
    },
  });

  io.on("error", (error) => {
    console.error("Socket.IO error:", error);
  });

  // message acknowledgement
  function acknowledgment(userId, message_id, conversation_id, level) {
    kafkaProducer.send({
      topic: "ACK",
      messages: [
        {
          value: JSON.stringify({ userId, message_id, conversation_id, level }),
        },
      ],
    }).then(ack=>{
      console.log('ack snt', ack)
    })
  }

  // Create Redis client here
  httpServer.listen(process.env.PORT, () => {
    console.log(
      `Socket Server running on port ${process.env.PORT} : Worker ` +
        cluster.worker.id,
      33
    );
  });
}
