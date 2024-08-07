"use client";
import { Box, Container, Grid, useMediaQuery } from "@mui/material";
import { alpha } from "@mui/material/styles";

import CssBaseline from "@mui/material/CssBaseline";
// import FriendList from "@/component/FriendList/Index";
import { Friend, Message } from "@/types/type";
import ChatTopBar from "@/component/ChatTab/TopBar";
import InputSection from "@/component/ChatTab/InputSection";
import Conversation from "@/component/ChatTab/Conversation";
import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import { http } from "@/Axios/http";
import io, { Socket } from "socket.io-client";
import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import _socket from "@/socket";
import { reactLocalStorage } from "reactjs-localstorage";
import moment from "moment";
import { friendStore } from "@/cache/friendsStore";
import { cacheStore } from "@/cache/chatStore";
import toast, { Toaster } from "react-hot-toast";
import { getConversation } from "@/Axios/api";
import { mainTheme } from "../layout";

const index = ({ params: { friendId } }: { params: Params }) => {
  const {
    friends,
    updateFriends,
    updatecnvIds,
    conversation_ids,
    updateLastMsg,
    setCurrentConvId,
  } = friendStore();
  const {
    getChats,
    updateChats,
    markMsgAsSeen,
    markMsgAsSent,
    markMsgAsSeenLocal,
  } = cacheStore();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const isSmallScreen = useMediaQuery("(max-width:600px)");
  const isLargeScreen = useMediaQuery("(min-width:1200px)");
  function storeTimestamp() {
    const timestamp = new Date().toISOString();
    localStorage.setItem("lastOnline", timestamp);
  }
  function pushChat(cnvid: string, msg: Message) {
    updateChats(cnvid, msg);
    updateLastMsg(cnvid, msg);
  }
  function seeLocalAndRemoteMsg(conversationId: string, msgs: Message[]) {
    markMsgAsSeenLocal(conversationId, userData.userName);
    seeMesages(msgs);
  }
  const fetchConversations = async (friends: Friend[]): Promise<void> => {
    if (friends) {
      const promises = friends.map(async (friend) => {
        if (friend.conversation_id) {
          try {
            const msgs = await getConversation(friend.conversation_id);
            const lnt = msgs.length;
            const lastMsg = msgs[lnt - 1];

            updateChats(friend.conversation_id, msgs);
            updateLastMsg(friend.conversation_id, lastMsg);
          } catch (error) {
            console.error("Error fetching conversation:", error);
          }
        }
      });

      await Promise.all(promises);
    }
  };

  useEffect(() => {
    if (friendId) {
      const cache_conv_id = conversation_ids[friendId];
      if (cache_conv_id) {
        setConversationId(cache_conv_id);
      } else {
        http
          .get("get-conversationId/" + friendId, { withCredentials: true })
          .then(({ data: { conversation_id } }) => {
            updatecnvIds(friendId, conversation_id);
            setConversationId(conversation_id);
          })
          .catch((err) => {
            if (err.response) {
              console.log("err", err.response.data.msg);
              toast.error(err.response.data.msg);
            } else {
              toast.error(err.message);
            }
          });
      }
    }
    const sessionState = !!sessionStorage.getItem("FREASH_IN");
    // stopping refetching all friends and chat in a session
    if (!sessionState) {
      fetchFriends().then((friends) => {
        fetchConversations(friends).then(() =>
          sessionStorage.setItem("FREASH_IN", "true")
        );
      });
    }
  }, []);
  useEffect(() => {
    console.log("conversationId", conversationId);
    const handleNewMsg = (msg: any) => {
      console.log(msg);
      const singleMsg = msg.message[0];
      pushChat(singleMsg.conversation_id, singleMsg);

      if (singleMsg.conversation_id == conversationId) {
        seeLocalAndRemoteMsg(singleMsg.conversation_id, msg.message);
      }
    };
    console.log("_socket", _socket);
    _socket.on("new-message", handleNewMsg);
    if (conversationId) {
      setCurrentConvId(conversationId);
      if (!getChats(conversationId)) {
        getConversation(conversationId).then((data) => {
          seeLocalAndRemoteMsg(conversationId, data);

          updateChats(conversationId, data);

          // if already friend exists and initiate chat with new user then refetch all friend
          if (friends) {
            if (!friends.find((it) => it.userName === friendId)) {
              console.log("fetchng  alex ls");

              fetchFriends();
            }
          }
        });
      } else {
        seeLocalAndRemoteMsg(conversationId, getChats(conversationId));
      }
    }
    return () => {
      console.log("rem lis");
      _socket.off("new-message", handleNewMsg);
    };
  }, [conversationId]);
  function fetchFriends(): Promise<Friend[]> {
    return new Promise((resolve, reject) => {
      http
        .get("participants/", { withCredentials: true })
        .then(({ data }) => {
          console.log("data", data);
          const prepFriends = data.map((it: any) => {
            const idfyFriend = it.participants.find(
              (f: any) => f != userData.userName
            );

            const friendData = it.participants_data[idfyFriend] ?? {
              userId: null,
              userName: null,
              profilePicture: null,
              conversation_id: null,
            };
            return {
              ...friendData,
              lastMsg: null,
            };
          });
          updateFriends(prepFriends);
          meOnline(prepFriends);
          resolve(prepFriends);
        })
        .catch((err) => {
          if (err.response) {
            toast.error(err.response.data.msg);
          } else {
            toast.error(err.message);
          }
          reject([]);
        });
    });
  }
  function meOnline(friends: Friend[]) {
    // will be called later when unseen msg count api will be implemented
    const sessionState = !!sessionStorage.getItem("NET_ONLINE_EMMITED");
    if (!sessionState) {
      _socket.emit("me-online", {
        broadcastIds: friends.map((it) => it.userName),
        onlineUser: userData.userName,
      });
      sessionStorage.setItem("NET_ONLINE_EMMITED", "true");
    }
  }

  async function seeMesages(fetchedMsgs: Message[]) {
    const unseenMsgs = fetchedMsgs.filter((it) => {
      if (it.status != "seen" && it.senderName == friendId) {
        return { senderName: it.senderName, reciverName: it.receiverName };
      }
    });
    console.log("unseenMsgs", unseenMsgs);
    if (unseenMsgs.length > 0) {
      _socket?.emit("seen-msg", {
        reciverName: unseenMsgs[0]?.receiverName,
        senderName: unseenMsgs[0]?.senderName,
      });
    }
  }
  const userData = reactLocalStorage.getObject("userData") as any;

  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!_socket) return alert("your id unauthorized");
    setSocket(_socket);
    console.log("_socket.id", _socket);

    _socket.on("friend-seen-msgs", ({ friendId }) => {
      const cache_conv_id = conversation_ids[friendId];
      if (!cache_conv_id) {
        http
          .get("get-conversationId/" + friendId, { withCredentials: true })
          .then(({ data: { conversation_id } }) => {
            markMsgAsSeen(conversation_id);
          });
      } else markMsgAsSeen(cache_conv_id);
    });
    _socket.on("friend-receive-msgs", ({ friendId }) => {
      // setSTATUS_MAP(friendId, true);
      const cache_conv_id = conversation_ids[friendId];
      if (!cache_conv_id) {
        http
          .get("get-conversationId/" + friendId, { withCredentials: true })
          .then(({ data: { conversation_id } }) => {
            markMsgAsSent(conversation_id);
          });
      } else markMsgAsSent(cache_conv_id);
    });
  }, []);

  const sendMsg = (msg: string) => {
    if (!conversationId) return alert("Connection id missing");
    const payload: Message = {
      receiverName: friendId,
      text: msg,
      senderName: userData.userName,
      time: moment(),
      id: uuidv4(),
      status: "offline",
      conversation_id: conversationId as string,
    };
    socket?.emit("new-msg", payload);

    pushChat(conversationId, { ...payload, status: "offline" });
  };

  const onMessageEnter = (message: string) => {
    if (!!message) sendMsg(message);
  };

  console.log("conversationId", conversationId);

  return (
    <>
      <Toaster />

      {friendId ? (
        <Grid sx={{ pt: 2, maxWidth: "100%" }} xs={isSmallScreen ? 12 : 9}>
          <Box
            sx={{
              height: "100vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Grid sx={{ flex: "1 0 1/12" }}>
              <ChatTopBar
                friendInfo={friends?.find((fr) => fr.userName === friendId)}
              />
            </Grid>

            <Grid
              className="Conversation-container"
              sx={{
                flex: "1 1 auto",
                overflowY: "auto",
              }}
            >
              <Conversation
                messages={conversationId ? getChats(conversationId) ?? [] : []}
              />
            </Grid>

            <Grid
              sx={{
                flex: "1 0 1/12",
                backgroundColor: alpha(mainTheme.palette.common.white, 0.07),
                p: 1,
              }}
            >
              <InputSection getInputValue={onMessageEnter} />
            </Grid>
          </Box>
        </Grid>
      ) : isLargeScreen ? (
        <Grid
          display="flex"
          justifyContent="center"
          alignItems="center"
          item
          xs={9}
        >
          Start Chat
        </Grid>
      ) : null}
    </>
  );
};

export default index;
