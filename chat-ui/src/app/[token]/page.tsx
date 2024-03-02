"use client";
import { http } from "@/Axios/http";
import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import toast from "react-hot-toast";
import { reactLocalStorage } from "reactjs-localstorage";
const page = ({ params: { token } }: { params: Params }) => {
  const router = useRouter();
  useEffect(() => {
    http
      .get("auth/chat-access-token", {
        params: {
          token,
        },
      })
      .then(({ data: { userData } }) => {
        reactLocalStorage.setObject("userData",userData);
        router.push("/conversation");
      })
      .catch(() => {
        toast.error("Authorization failed!!!");
      });
  }, [token]);

  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        height: "100vh",
        width: "100vw",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "black",
      }}
    >
      Authenticating...
    </div>
  );
};

export default page;
