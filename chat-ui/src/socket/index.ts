import io, { Socket } from "socket.io-client";
import { reactLocalStorage } from "reactjs-localstorage";
const port =
  Number(process.env.NEXT_PUBLIC_PORT ?? 5000) + Math.floor(Math.random() * 4);

const serverUrl = `${process.env.NEXT_PUBLIC_CHAT_SOCKET_SERVER_HOST}:${port}`;

const _socket = io(serverUrl);
const userData = reactLocalStorage.getObject("userData") as any;
_socket.emit("join-chat", { userId: userData.userName });
export default _socket;
