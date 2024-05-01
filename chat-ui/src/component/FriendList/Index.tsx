"use client";
import * as React from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import { Friend } from "@/types/type";
import { useRouter } from "next/navigation";

export default function FriendList({ friends }: { friends: Array<Friend> }) {
  const router = useRouter();
  console.log('friends', friends)
  const startChat = (user: Friend) => {
    router.push(`/conversation/${user.userName}`);
  };
  return (
    <List sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}>
      {friends.map(({ userId, userName, profilePicture, lastMsg ,conversation_id}) => {
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
              startChat({ userId, userName, profilePicture, lastMsg,conversation_id })
            }
          >
            <ListItemAvatar>
              <Avatar src={profilePicture} />
            </ListItemAvatar>
            <ListItemText primary={userName} secondary={"hello"} />
          </ListItem>
        );
      })}
    </List>
  );
}
