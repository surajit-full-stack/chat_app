"use client";
import * as React from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import { getConversation } from "@/Axios/api";
import { friendStore } from "@/cache/friendsStore";
import { cacheStore } from "@/cache/chatStore";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const FriendList = () => {
  const { updateChats, getChats, chats } = cacheStore();
  const { friends, updateLastMsg } = friendStore();

  const { friendId } = useParams();



  return (
    <List sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}>
      {friends?.map(
        ({ userId, userName, profilePicture, lastMsg, conversation_id }) => {
          
          // updateLastMsg(conversation_id, newestMsg);
          return (
            <Link
              key={userName}
              className="friend-link"
              href={`/conversation/${userName}`}
            >
              <ListItem
                key={userName}
                sx={{
                  background: friendId === userName ? "#5356FF" : "",
                  cursor: "pointer",
                  "&:hover": {
                    background: "#5356FF",
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar src={profilePicture} />
                </ListItemAvatar>
                <ListItemText primary={userName} secondary={lastMsg?.text} />
              </ListItem>
            </Link>
          );
        }
      )}
    </List>
  );
};

export default FriendList;
