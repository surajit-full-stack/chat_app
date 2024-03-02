import mongose from "mongoose";

const url = process.env.MONGO_URL;

import dotenv from "dotenv";

dotenv.config();


const UserSchema = new mongose.Schema({
  userName: {
    type: String,
    unique: true,
  },
});

// Define schema for Friend
const FriendSchema = new mongose.Schema({
  user_id: { type: String },
  friend_id: { type: String },
  last_message: String,
});

// Define schema for Message
const MessageSchema = new mongose.Schema({
  senderName: { type: String },
  receiverName: { type: String },
  text: { type: String },
  id: { type: String },
  time: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["sent", "offline", "seen"],
    default: "offline",
  },
});

// const User = mongose.model("User", UserSchema);
const Friend = mongose.model("Friend", FriendSchema);
const Message = mongose.model("Message", MessageSchema);

class ChatDb {

  async connect() {
    try {
      await mongose.connect(url);
      console.log("Connected to Mongo DB");
    } catch (error) {
      console.log("error", error);
    }
  }
  async addChat(senderName, receiverName, text, time, status, id) {
    const newMessage = new Message({
      senderName,
      receiverName,
      text,
      time,
      status,
    });
    await newMessage.save();
  }
}

const database = () => {
  return new ChatDb();
};
export default database;
