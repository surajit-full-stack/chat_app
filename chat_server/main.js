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
import mongodb from "./db.js";
dotenv.config();

const numCPUs = cpus().length;

const corsOptions = {
  methods: "GET,POST",
  credentials: true,
  origin: process.env.CHAT_UI_HOST,
};

const redisOptionsPubSub = {
  host: process.env.PUB_SUB_REDIS_HOST ?? "localhost",
  port: process.env.PUB_SUB_REDIS_PORT ?? 6300,
  // password: "notification-pub-sub-redis",
};

await mongodb().connect();

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

  // // Redis Socket Ids
  const socketIds = new Map();

  // // Redis Subscriber Publisher
  const publisher = new Redis(redisOptionsPubSub);
  const subscriber = new Redis(redisOptionsPubSub);

  subscriber.subscribe("MESSAGE");
  subscriber.subscribe("ACK");

  subscriber.on("error", (err) => console.log(" sub err", err));
  subscriber.on("connect", () => {
    console.log("Redis Connected", 30, 41);
  });

  //? Handle Socket Connection

  io.on("connection", (socket) => {
    socket.on("join-chat", ({ userId }) => {
      console.log("++++", userId);

      socketIds.set(userId, socket.id);

      socket.userId = userId;
      //   const _to_join = following.map((id) => "base:" + id);
      //   socket.join(_to_join);
      //   console.log("joined", _to_join.join(","));
    });
    socket.on("new-msg", (message_packet) => {
      console.log("first", message_packet);
      publisher.publish("MESSAGE", JSON.stringify(message_packet));
    });
    socket.on("disconnect", () => {
      console.log("Client disconnected", socket.userId);
      socketIds.delete(socket.userId);
    });
  });
  subscriber.on("message", (channel, message) => {
    console.log("channel", channel, ": sub:" + cluster?.worker?.id);
    if (channel == "ACK") {
      const ack_packet = JSON.parse(message);
      const { userId, message_id, level } = ack_packet;
      const messager_socket_id = socketIds.get(userId);
      if (messager_socket_id) {
        io.to(messager_socket_id).emit("acknowledgment", {
          level,
          message_id,
        });
      }
    } else {
      const message_packet = JSON.parse(message);
      const { receiverName } = message_packet;
      let _status = "offline";
      const destination_socket_id = socketIds.get(receiverName);
      if (destination_socket_id) {
        _status = "sent";
        io.to(destination_socket_id).emit("new-message", {
          message: [message_packet],
        });
        acknowledgment(message_packet.senderName, message_packet.id, "sent");
      } else {
        // acknowledgment(message_packet.senderName, message_packet.id, "offline");
      }

      //
      //todo   produce kafka message ----> node js consume -----> batch insert mongo db
      const { text, senderName, time, id } = message_packet;
      mongodb().addChat(senderName, receiverName, text, time, _status, id);
      //
    }
  });
  io.on("error", (error) => {
    console.error("Socket.IO error:", error);
  });

  // message acknowledgement
  function acknowledgment(userId, message_id, level) {
    publisher.publish("ACK", JSON.stringify({ userId, message_id, level }));
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
