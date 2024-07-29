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
import _socket from "@/socket";
import { styled } from "@mui/material/styles";

const StyledBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    backgroundColor: "#44b700",
    color: "#44b700",
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    "&::after": {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      animation: "ripple 1.2s infinite ease-in-out",
      border: "1px solid currentColor",
      content: '""',
    },
  },
  "@keyframes ripple": {
    "0%": {
      transform: "scale(.8)",
      opacity: 1,
    },
    "100%": {
      transform: "scale(2.4)",
      opacity: 0,
    },
  },
}));

const FriendList = () => {
  const { getChats } = cacheStore();
  const { friends, CURRENT_CONV_ID } = friendStore();
  const userData = reactLocalStorage.getObject("userData") as any;

  const { friendId } = useParams();
  const [STATUS_MAP, setSTATUS_MAP] = React.useState(new Map());

  React.useEffect(() => {
    friends?.forEach(({ userName }) => {
      const handleStatusChange = (data: any) => {
        console.log('data', data)
        setSTATUS_MAP((prev) => {
          const newMap = new Map(prev);
          newMap.set(userName, data.status);
          return newMap;
        });
      };
      _socket.on(`user-status-${userName}`, handleStatusChange);
    });

    return () => {
      friends?.forEach(({ userName }) => {
        _socket.off(`user-status-${userName}`);
      });
    };
  }, [friends]);


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
                  {STATUS_MAP.get(userName) ? (
                    <StyledBadge
                      overlap="circular"
                      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                      variant="dot"
                    >
                      {" "}
                      <Avatar src={profilePicture} />
                    </StyledBadge>
                  ) : (
                    <Avatar src={profilePicture} />
                  )}
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
