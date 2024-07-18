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
import { AxiosError } from "axios";
import toast, { Toaster } from "react-hot-toast";

export const mainTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

const index = ({ params: { friendId } }: { params: Params }) => {
  const { friends, updateFriends, updatecnvIds, conversation_ids } =
    friendStore();
  const { getChats, updateChats, markMsgAsSeen, markMsgAsSent } = cacheStore();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const query = useSearchParams();

  function storeTimestamp() {
    const timestamp = new Date().toISOString();
    localStorage.setItem("lastOnline", timestamp);
  }

  useEffect(() => {
    window.addEventListener("beforeunload", storeTimestamp);

    return () => {
      window.removeEventListener("beforeunload", storeTimestamp);
    };
  });

  useEffect(() => {
    if (conversationId) {
      getConversation(conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    if (friendId) {
      console.log("conversation_ids", conversation_ids);
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
    if (friends) {
      // refecthing all friend when visit non existing chat
      if (!friends.find((fr) => fr.userName == friendId)) fetchFriends();
      return meOnline(friends); // alert friends that im online
    }
    fetchFriends();
  }, []);
  function fetchFriends() {
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
          };
          return {
            ...friendData,
            lastMsg: null,
          };
        });
        updateFriends(prepFriends);
        meOnline(prepFriends);
      })
      .catch((err) => {
      
        if (err.response) {
          toast.error(err.response.data.msg);
        } else {
          toast.error(err.message);
        }
      });
  }
  function meOnline(friends: Friend[]) {
    // will be called later when unseen msg count api will be implemented
    const sessionState = !sessionStorage.getItem("FREASH");
    if (sessionState) {
      _socket.emit("me-online", {
        broadcastIds: friends.map((it) => it.userName),
        onlineUser: userData.userName,
      });
      sessionStorage.setItem("FREASH", "true");
    }
  }
  async function getConversation(cnvId: string) {
    try {
      // const fetchedMsgCount = getChats(cnvId).length;
      // `?skip=${fetchedMsgCount}`
      const { data } = await http.get("conversations/" + cnvId, {
        withCredentials: true,
      });
      updateChats(cnvId, data.msg);
      setMessages(data.msg);
      seeMesages(data.msg);
    } catch (err) {
      if (err.response) {
        toast.error(err.response.data.msg);
      } else {
        toast.error(err.message);
      }
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
  const [messages, setMessages] = useState<Array<Message>>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    console.log("ooooooooooooo");
    if (!_socket) return alert("your id unauthorized");
    setSocket(_socket);
    console.log("_socket.id", _socket);
    _socket.removeAllListeners("new-message");
    _socket.on("new-message", (msg: any) => {
      console.log("msg recieved", msg);
      const singleMsg = msg.message[0];
      updateChats(singleMsg.conversation_id, singleMsg);
      seeMesages(msg.message);
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
      updateChats(conversation_id, updatedStatus);
    });
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
      console.log("fr rcv msg");
      const cache_conv_id = conversation_ids[friendId];
      if (!cache_conv_id) {
        http
          .get("get-conversationId/" + friendId, { withCredentials: true })
          .then(({ data: { conversation_id } }) => {
            markMsgAsSent(conversation_id);
          });
      }
      markMsgAsSent(cache_conv_id);
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
    <>
      <Toaster />
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
                      friendInfo={friends?.find(
                        (fr) => fr.userName === friendId
                      )}
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
    </>
  );
};

export default index;
