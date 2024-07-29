import { Friend, Message } from "@/types/type";
import { stat } from "fs";
import moment, { Moment } from "moment";
import { create, StateCreator } from "zustand";
import { persist, PersistOptions } from "zustand/middleware";

type CacheData = {
  friends: Array<Friend> | null;
  CURRENT_CONV_ID: string | null;
  setCurrentConvId: (id: string) => void;
  updateFriends: (friends: Array<Friend>) => void;
  updateLastMsg: (cnvId: string, lastMsg: Message) => void;
  updatecnvIds: (userName: string, id: string) => void;
  conversation_ids: any;
};

type MyPersist = (
  config: StateCreator<CacheData>,
  options: PersistOptions<CacheData>
) => StateCreator<CacheData>;

export const friendStore = create<CacheData>(
  (persist as MyPersist)(
    (set, get) => ({
      friends: null,
      CURRENT_CONV_ID: null,
      conversation_ids: {},
      setCurrentConvId: (id) => {
        set({ CURRENT_CONV_ID: id });
      },
      updateFriends: (friends) => {
        set((state) => {
          return { friends };
        });
      },
      updateLastMsg(cnvId, lastMsg) {
        console.log("ppppppppppppppppppp");
        set((state) => {
          const _friends = state.friends?.map((it) => {
            if (it.conversation_id === cnvId) return { ...it, lastMsg };
            else return it;
          });
          const sorted_friend = _friends?.sort((a, b) => {
            const timeA = a.lastMsg?.time
              ? moment(a.lastMsg.time).valueOf()
              : 0;
            const timeB = b.lastMsg?.time
              ? moment(b.lastMsg.time).valueOf()
              : 0;
            return timeB - timeA;
          });

          return { friends: sorted_friend };
        });
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
