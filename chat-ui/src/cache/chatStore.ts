import { Friend, Message } from "@/types/type";
import { StateCreator, create } from "zustand";
import { PersistOptions, persist } from "zustand/middleware";

type CacheData = {
  chats: Array<Message> | null;
  updateChats: (chats: Array<Message>) => void;
};

type MyPersist = (
  config: StateCreator<CacheData>,
  options: PersistOptions<CacheData>
) => StateCreator<CacheData>;

export const cacheStore = create<CacheData>(
  (persist as MyPersist)(
    (set) => ({
     
      chats: null,
     
      updateChats: (chats) => {
        set({ chats });
      },
    }),
    {
      name: "chat-store",
      getStorage: () => sessionStorage,
      
    }
  )
);
