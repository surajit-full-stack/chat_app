"use client";
import { Box, Container, Grid } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import FriendList from "@/component/FriendList/Index";
import { Friend, Message } from "@/types/type";
import TopBar from "@/component/FriendList/TobBar";
import ChatTopBar from "@/component/ChatTab/TopBar";
import InputSection from "@/component/ChatTab/InputSection";
import Conversation from "@/component/ChatTab/Conversation";
import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import { http } from "@/Axios/http";
import io, { Socket } from "socket.io-client";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import _socket from "@/socket";
import { reactLocalStorage } from "reactjs-localstorage";
import moment from "moment";
import { friendStore } from "@/cache/friendsStore";
import { cacheStore } from "@/cache/chatStore";
import { useSearchParams } from "next/navigation";

export const mainTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

const index = ({ params: { friendId } }: { params: Params }) => {
  const { friends, updateFriends, updatecnvIds, conversation_ids } =
    friendStore();
  const { getChats, updateChats } = cacheStore();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const query = useSearchParams();
  console.log("ss", query.get("c"));
  useEffect(() => {
    if (friendId) {
      console.log("conversation_ids", conversation_ids);
      const cache_conv_id = conversation_ids[friendId];
      if (cache_conv_id) {
        setConversationId(cache_conv_id);
        const sessionState = !sessionStorage.getItem("FREASH");
        if (sessionState) {
          sessionStorage.setItem("FREASH", "true");
          getConversation(cache_conv_id);
        }
      } else {
        http
          .get("get-conversationId/" + friendId, { withCredentials: true })
          .then(({ data: { conversation_id } }) => {
            updatecnvIds(friendId, conversation_id);
            setConversationId(conversation_id);
            getConversation(conversation_id);
          });
      }
    }
    if (friends) return;
    http.get("get-following/", { withCredentials: true }).then(({ data }) => {
      updateFriends(
        data.map((it: any) => {
          return {
            ...it,
            lastMsg: null,
          };
        })
      );
    });
  }, []);
  async function getConversation(cnvId: string) {
    try {
      // const fetchedMsgCount = getChats(cnvId).length;
      // `?skip=${fetchedMsgCount}`
      const { data } = await http.get("conversations/" + cnvId, {
        withCredentials: true,
      });
      updateChats(cnvId, data.msg);
      setMessages(data.msg);
    } catch (error) {
      alert("check error");
    }
  }
  const userData = reactLocalStorage.getObject("userData") as any;
  const [messages, setMessages] = useState<Array<Message>>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!_socket) return alert("your id unauthorized");
    setSocket(_socket);

    _socket.removeAllListeners("new-message");
    _socket.on("new-message", (msg) => {
      console.log("msg recieved", msg);
      const singleMsg = msg.message[0];
      updateChats(singleMsg.conversation_id, singleMsg);
    });
    _socket.on("acknowledgment", ({ level, message_id, conversation_id }) => {
      console.log("hh", level, message_id, conversation_id);

      let prev = getChats(conversation_id);
      const updatedStatus = prev.map((it) => {
        if (it.id === message_id) {
          return { ...it, status: level };
        }
        return it;
      });
      updateChats(conversation_id,updatedStatus)

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

    updateChats(conversationId, { ...payload, status: "offline" });

    setMessages((prev) => [...prev, { ...payload, status: "offline" }]);
  };
  console.log("messeges", messages);
  const onMessageEnter = (message: string) => {
    if (!!message) sendMsg(message);
  };

  console.log("conversationId", conversationId);

  return (
    <ThemeProvider theme={mainTheme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={2}>
          <Grid sx={{ borderRight: "1px solid black" }} item xs={3}>
            <TopBar />
            <Box sx={{ maxHeight: "calc(100vh - 64px)", overflowY: "auto" }}>
              <FriendList friends={friends ?? []} />
            </Box>
          </Grid>
          {friendId ? (
            <Grid sx={{ pt: 2 }} xs={9}>
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
                  sx={{
                    flex: "1 1 auto",
                    overflowY: "auto",
                  }}
                >
                  <Conversation
                    messages={conversationId ? getChats(conversationId) : []}
                  />
                </Grid>

                <Grid
                  sx={{
                    flex: "1 0 1/12",
                    backgroundColor: alpha(
                      mainTheme.palette.common.white,
                      0.07
                    ),
                    p: 1,
                  }}
                >
                  <InputSection getInputValue={onMessageEnter} />
                </Grid>
              </Box>
            </Grid>
          ) : (
            <Grid
              display="flex"
              justifyContent="center"
              alignItems="center"
              item
              xs={9}
            >
              Start Chat
            </Grid>
          )}
        </Grid>
      </Box>
    </ThemeProvider>
  );
};

export default index;
