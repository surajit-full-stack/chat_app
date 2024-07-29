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

  const workers = [];
  workers.push({ kafka_broker_port: process.env.KAFKA_BROKER });

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    workers.push({ port: parseInt(process.env.PORT) + i });
    cluster.fork({ PORT: parseInt(process.env.PORT) + i });
  }
  console.log(`CHAT SERVERs`);

  console.table(workers);
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
    console.table([{ name: "Kafka", status: "ok" }]);
  } catch (error) {
    console.table([
      { name: "Kafka ", status: `${error.message}` },
    ]);
  }

  //? Handle Socket Connection

  io.on("connection", (socket) => {
    socket.on("join-chat", ({ userId }) => {
      console.log("++++", userId);

      // consume at kafka-consumer service (docker) an DB write
      kafkaProducer.send({
        topic: "user-online-status",
        messages: [{ value: JSON.stringify({ userId, status: true }) }],
      });

      socketIds.set(userId, socket.id);

      socket.userId = userId;
    });
    socket.on("new-msg", (message_packet) => {
      const { senderName, receiverName } = message_packet;
      let senderSId = socketIds.get(senderName);
      if (senderSId) message_packet.senderSId = senderSId;

      let receiverSId = socketIds.get(receiverName);
      if (receiverSId) message_packet.receiverSId = receiverSId;

      kafkaProducer.send({
        topic: "chat",
        messages: [{ value: JSON.stringify(message_packet) }],
      });
    });
    // when user open chat (processing blue double tick)
    socket.on("seen-msg", ({ senderName, reciverName }) => {
      kafkaProducer.send({
        topic: "seen-msg",
        messages: [{ value: JSON.stringify({ senderName, reciverName }) }],
      });
      // update database whenever user seen chat
      kafkaProducer.send({
        topic: "seen-msg-db-write",
        messages: [{ value: JSON.stringify({ senderName, reciverName }) }],
      });
    });
    socket.on("me-online", ({ broadcastIds, onlineUser }) => {
      kafkaProducer.send({
        topic: "ACK",
        messages: [{ value: JSON.stringify({ broadcastIds, onlineUser }) }],
      });
    });
    socket.on("disconnect", () => {
      console.log("-");
      socketIds.delete(socket.userId);
      kafkaProducer.send({
        topic: "user-online-status",
        messages: [
          { value: JSON.stringify({ userId: socket.userId, status: false }) },
        ],
      });
    });
  });

  await chat_consumer.run({
    eachMessage: async ({ topic: channel, message: rawMessage }) => {
      const message = rawMessage.value;

      // bulk insert payload => batch.messages.map((it) => JSON.parse(it.value))
      try {
        if (channel == "seen-msg") {
          const message_packet = JSON.parse(message);

          const { reciverName, senderName } = message_packet;
          const senderSocketId = socketIds.get(senderName);
          if (senderSocketId) {
            io.to(senderSocketId).emit("friend-seen-msgs", {
              friendId: reciverName,
            });
          }
        } else if (channel == "chat") {
          const message_packet = JSON.parse(message);
          const { senderName, receiverName } = message_packet;
          const _status = "offline";

          const destination_socket_id = socketIds.get(receiverName);
          const sender_socket_id = socketIds.get(senderName);

          // if (sender_socket_id && destination_socket_id) {
          //   console.log("sent double tick to sender");
          //   io.to(sender_socket_id).emit("friend-receive-msgs", {
          //     friendId: receiverName,
          //   });
          // }

          if (destination_socket_id) {
            // status "sent" (double tick)
            kafkaProducer
              .send({
                topic: "ACK",
                messages: [
                  {
                    value: JSON.stringify({
                      senderName,
                      receiverName,
                      id: message_packet.id,
                    }),
                  },
                ],
              })
              .then((it) => {
                io.to(destination_socket_id).emit("new-message", {
                  message: [message_packet],
                });
              });
          } else {
            // acknowledgment(message_packet.senderName, message_packet.id, "offline");
          }
        } else if (channel === "ACK") {
          const message_packet = JSON.parse(message);
          const { senderName, receiverName, onlineUser, broadcastIds } =
            message_packet;

          if (broadcastIds && onlineUser) {
            broadcastIds.forEach((userName) => {
              let sId = socketIds.get(userName);

              if (sId) {
                io.to(sId).emit("friend-receive-msgs", {
                  friendId: onlineUser,
                });
                kafkaProducer.send({
                  topic: "check-user-online-status",
                  messages: [
                    {
                      value: JSON.stringify({
                        onlineUser,
                        queriedId: userName,
                      }),
                    },
                  ],
                });
              }
            });
          } else if (senderName && receiverName) {
            const sender_socket_id = socketIds.get(senderName);
            if (senderName) {
              io.to(sender_socket_id).emit("friend-receive-msgs", {
                friendId: receiverName,
              });
            }
          }
        } else if (channel === "user-online-status") {
          const message_packet = JSON.parse(message);
          const { userId, status } = message_packet;

          io.emit(`user-status-${userId}`, {
            status,
          });
        } else if (channel === "check-user-online-status") {
          const message_packet = JSON.parse(message);
          const { queriedId, onlineUser } = message_packet;
          const onlineUserSocketId = socketIds.get(onlineUser);

          if (onlineUserSocketId) {
            io.to(onlineUserSocketId).emit(`user-status-${queriedId}`, {
              status: true,
            });
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

  // Create Redis client here
  httpServer.listen(process.env.PORT, () => {});
}
