import { Friend, Message } from "@/types/type";
import { StateCreator, create } from "zustand";
import { PersistOptions, persist } from "zustand/middleware";

type CacheData = {
  friends: Array<Friend> | null;
  chats: Array<Message> | null;
  updateFriends: (friends: Array<Friend>) => void;
  updateChats: (chats: Array<Message>) => void;
};

type MyPersist = (
  config: StateCreator<CacheData>,
  options: PersistOptions<CacheData>
) => StateCreator<CacheData>;

export const cacheStore = create<CacheData>(
  (persist as MyPersist)(
    (set) => ({
      friends: null,
      chats: null,
      updateFriends: (friends) => {
        set({ friends });
      },
      updateChats: (chats) => {
        set({ chats });
      },
    }),
    { name: "cache-store" }
  )
);
