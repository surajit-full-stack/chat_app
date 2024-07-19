import { Moment } from "moment";

export type Friend = {
  userId: number;
  userName: string;
  profilePicture: string;
  lastMsg: Moment | null;
  conversation_id: string;
};

export type Message = {
  senderName: string;
  receiverName: string;
  text: string;
  time: Moment;
  status: "sent" | "offline" | "seen";
  id: string;
  conversation_id: string;
};
