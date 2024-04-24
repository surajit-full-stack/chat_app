import { Friend } from "@/types/type";
import { create } from "zustand";

type CacheData = {
  friends: Array<Friend> | null;
  updateFriends: (friends: Array<Friend>) => void;
};

export const friendStore = create<CacheData>((set) => ({
  friends: null,

  updateFriends: (friends) => {
    set({ friends });
  },
}));
