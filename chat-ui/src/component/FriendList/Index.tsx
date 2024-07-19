"use client";
import * as React from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import { Friend, Message } from "@/types/type";
import { useRouter } from "next/navigation";
import { getConversation } from "@/Axios/api";
import { friendStore } from "@/cache/friendsStore";
import { cacheStore } from "@/cache/chatStore";

export default function FriendList() {
  const { updateChats, getChats } = cacheStore();
  const { friends } = friendStore();
  const router = useRouter();

  const startChat = (user: Friend) => {
    router.push(`/conversation/${user.userName}`);
  };
  React.useEffect(() => {
    if (friends) {
      const fetchConversations = async () => {
        for (const friend of friends) {
          if (friend.conversation_id) {
            try {
              const msgs = await getConversation(friend.conversation_id);
              updateChats(friend.conversation_id, msgs);
            } catch (error) {
              console.error("Error fetching conversation:", error);
            }
          }
        }
      };

      fetchConversations();
    }
  }, [friends, updateChats]);
  return (
    <List sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}>
      {friends?.map(
        ({ userId, userName, profilePicture, lastMsg, conversation_id }) => {
          const myChats = getChats(conversation_id);
          const lastMessage = myChats[myChats.length - 1].text ?? "";
          return (
            <ListItem
              key={userName}
              sx={{
                cursor: "pointer",
                "&:hover": {
                  background: "#5356FF",
                },
              }}
              onClick={() =>
                startChat({
                  userId,
                  userName,
                  profilePicture,
                  lastMsg,
                  conversation_id,
                })
              }
            >
              <ListItemAvatar>
                <Avatar src={profilePicture} />
              </ListItemAvatar>
              <ListItemText primary={userName} secondary={lastMessage} />
            </ListItem>
          );
        }
      )}
    </List>
  );
}
