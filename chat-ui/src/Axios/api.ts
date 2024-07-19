import { Message } from "@/types/type";
import { http } from "./http";
import toast from "react-hot-toast";
import { friendStore } from "@/cache/friendsStore";

export const getConversation = async (cnvId: string): Promise<Message[]> => {
  try {
    const { data } = await http.get("conversations/" + cnvId, {
      withCredentials: true,
    });
    return data.msg;
  } catch (err: any) {
    if (err.response) {
      toast.error(err.response.data.msg);
    } else {
      toast.error(err.message);
    }
    return [];
  }
};
