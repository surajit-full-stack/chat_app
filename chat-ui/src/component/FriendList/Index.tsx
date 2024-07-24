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
import { Badge } from "@mui/material";
import { reactLocalStorage } from "reactjs-localstorage";

const FriendList = () => {
  const { getChats } = cacheStore();
  const { friends, CURRENT_CONV_ID } = friendStore();
  const userData = reactLocalStorage.getObject("userData") as any;

  const { friendId } = useParams();

  return (
    <List sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}>
      {friends?.map(
        ({ userId, userName, profilePicture, lastMsg, conversation_id }) => {
          const all_msgs = getChats(conversation_id) ?? [];
          const unseen_msgs_count = all_msgs.filter(
            (msg) =>
              msg.status !== "seen" && msg.receiverName === userData.userName
          ).length;
          // condtion to show the badge
          const badge_flag: Boolean = !CURRENT_CONV_ID
            ? unseen_msgs_count > 0
              ? true
              : false
            : CURRENT_CONV_ID !== friendId
            ? true
            : false;
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
                {badge_flag && (
                  <Badge
                    anchorOrigin={{
                      vertical: "top",
                      horizontal: "left",
                    }}
                    badgeContent={unseen_msgs_count}
                    color="success"
                  >
                    {" "}
                  </Badge>
                )}
              </ListItem>
            </Link>
          );
        }
      )}
    </List>
  );
};

export default FriendList;
