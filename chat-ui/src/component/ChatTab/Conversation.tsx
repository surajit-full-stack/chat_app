"use client";
import { mainTheme } from "@/app/conversation/page";
import { Message } from "@/types/type";
import { Box, Divider, Stack, Typography, alpha } from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import React, { useEffect, useState } from "react";
import { reactLocalStorage } from "reactjs-localstorage";
import moment from "moment";
type ConverSationProps = {
  messages: Array<Message>;
};
const statusStyle = { fontSize: "1rem", ml: "5px" };
const Conversation = ({ messages }: ConverSationProps) => {
  const userData = reactLocalStorage.getObject("userData") as any;
  const me = userData.userName;
  const myTextBox = {
    borderRadius: "16px 16px  4px 16px",
    borderBottomRightRadius: "4px",
  };
  const remoteTextBox = {
    borderRadius: "16px 16px  16px 4px",
    borderBottomLeftRadius: "4px",
  };

  const [searchMessage, setSearchMessage] = useState<string>(
    window.location.hash
  );
  useEffect(() => {
    if (searchMessage) {
      const element = document.getElementById(searchMessage.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, []);

  return (
    <Box sx={{ width: "100%", height: "auto" }}>
     
        {messages.length > 0 && (
          <Box
            sx={{
              pt: 2,
              width: "100%",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="caption"
              color="textSecondary"
              display="flex"
              justifyContent="end"
              alignItems="center"
            >
              {" "}
              {moment(messages[0].time).format("ll")}
            </Typography>
          </Box>
        )}
        {messages.map(
          ({ text, senderName, time: rawTime, status, id }, ind) => {
            const time = moment(rawTime);

            const isMe = senderName === me;
            const textBox = isMe ? myTextBox : remoteTextBox;
            const backgroundColor =
              searchMessage.substring(1) === id
                ? mainTheme.palette.success.dark
                : isMe
                ? alpha(mainTheme.palette.success.dark, 0.45)
                : alpha(mainTheme.palette.common.white, 0.07);
            return (
              <Stack spacing={1}>
                {" "}
                <Box
                  display="flex"
                  justifyContent={isMe ? "end" : "start"}
                  alignItems="center"
                  component="div"
                 
                >
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    sx={{
                      backgroundColor,
                      p: 2,
                      mx: 2,
                      my: 1,
                      maxWidth:'70%',
                    
                      ...textBox,
                    }}
                  >
                    {text}
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      display="flex"
                      justifyContent="end"
                      alignItems="center"
                    >
                      {time.format("hh:mm a")}

                      {isMe ? (
                        status === "seen" ? (
                          <DoneAllIcon color="info" sx={statusStyle} />
                        ) : status === "sent" ? (
                          <DoneAllIcon sx={statusStyle} />
                        ) : (
                          <DoneIcon sx={statusStyle} />
                        )
                      ) : null}
                    </Typography>
                  </Typography>
                </Box>
                {ind + 1 < messages.length &&
                  !time.isSame(moment(messages[ind + 1].time), "day") && (
                    <Divider sx={{ px: 20 }} variant="middle">
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        display="flex"
                        justifyContent="end"
                        alignItems="center"
                      >
                        {" "}
                        {moment(messages[ind + 1].time).format("ll")}
                      </Typography>
                    </Divider>
                  )}
                <div id={id}></div>
                </Stack>
            );
          }
        )}
     
    </Box>
  );
};

export default Conversation;
