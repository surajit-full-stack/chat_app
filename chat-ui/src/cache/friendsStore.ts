import { Friend } from "@/types/type";
import { create, StateCreator } from "zustand";
import { persist, PersistOptions } from "zustand/middleware";

type CacheData = {
  friends: Array<Friend> | null;
  updateFriends: (friends: Array<Friend>) => void;
  updatecnvIds: (userName: string, id: string) => void;
  conversation_ids: any;
};

type MyPersist = (
  config: StateCreator<CacheData>,
  options: PersistOptions<CacheData>
) => StateCreator<CacheData>;

export const friendStore = create<CacheData>(
  (persist as MyPersist)(
    (set) => ({
      friends: null,
      conversation_ids: {},
      updateFriends: (friends) => {
        set({ friends });
      },
      updatecnvIds: (userName: string, id: string) => {
        set((state) => ({
          conversation_ids: { ...state.conversation_ids, [userName]: id },
        }));
      },
    }),
    {
      name: "friend-store",
      getStorage: () => localStorage,
    }
  )
);
