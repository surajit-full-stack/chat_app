import { Friend, Message } from "@/types/type";
import { StateCreator, create } from "zustand";
import { PersistOptions, persist } from "zustand/middleware";
import { friendStore } from "./friendsStore";

type ChatBase = {
  [key: string]: Array<Message>;
};
type CacheData = {
  chats: ChatBase;
  updateChats: (convId: string, chats: Array<Message> | Message) => void;
  markMsgAsSeen: (convId: string) => void;
  markMsgAsSent: (convId: string) => void;
  getChats: (convId: string) => Array<Message>;
};

type MyPersist = (
  config: StateCreator<CacheData>,
  options: PersistOptions<CacheData>
) => StateCreator<CacheData>;

export const cacheStore = create<CacheData>(
  (persist as MyPersist)(
    (set, get) => ({
      chats: {},

      updateChats: (convId, chats) => {
        if (Array.isArray(chats)) {
          console.log("rewrite");
          set((state) => ({
            chats: { ...state.chats, [convId]: chats },
          }));
        } else {
          const prev = get().chats[convId] ?? [];
          const curr = [...prev, chats];
          set((state) => ({ chats: { ...state.chats, [convId]: curr } }));
        }
      },
      markMsgAsSeen: (convId) => {
        console.log('llllloooo')
        set((state) => ({
          chats: {
            ...state.chats,
            [convId]: get().chats[convId].map((it) => ({
              ...it,
              status: "seen",
            })),
          },
        }));
      },
      markMsgAsSent: (convId) => {
        set((state) => ({
          chats: {
            ...state.chats,
            [convId]: get().chats[convId].map((it) => {
              if (it.status == "offline") return { ...it, status: "sent" };
              else return it;
            }),
          },
        }));
      },

      getChats: (convId) => {
        const data = get().chats;
        return data[convId] ?? null;
      },
    }),
    {
      name: "chat-store",
      getStorage: () => localStorage,
    }
  )
);
