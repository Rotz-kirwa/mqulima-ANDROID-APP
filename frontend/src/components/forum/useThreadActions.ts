import { useMutation, useQueryClient, InfiniteData } from "@tanstack/react-query";
import { Platform, Share } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { api, ApiThread, ForumFeed } from "@/src/services/api";
import { useApp } from "@/src/store/AppStore";

export function useThreadActions(t: ApiThread) {
  const qc = useQueryClient();
  const router = useRouter();
  const { user, toast } = useApp();
  const apply = (patch: Partial<ApiThread>) => {
    const update = (item: ApiThread) => item.id === t.id ? { ...item, ...patch } : item;
    qc.setQueriesData<ApiThread>({ queryKey: ["thread", t.id] }, old => old ? update(old) : old);
    qc.setQueriesData<InfiniteData<ForumFeed>>({ queryKey: ["forum-feed"] }, old => old ? { ...old, pages: old.pages.map(page => ({ ...page, items: page.items.map(update) })) } : old);
    qc.setQueriesData<ApiThread[]>({ queryKey: ["threads"] }, old => old?.map(update));
    qc.invalidateQueries({ queryKey: ["my-threads"] });
  };
  const fail = (e: Error) => toast(e.message || "Could not save your change. Please try again.");
  const like = useMutation({ mutationFn: () => api.toggleLike(t.id), onSuccess: result => { apply(result); qc.invalidateQueries({ queryKey: ["forum-feed"] }); }, onError: fail });
  const bookmark = useMutation({ mutationFn: () => api.bookmarkThread(t.id, !t.saved), onSuccess: result => { apply(result); toast(result.saved ? "Discussion saved" : "Removed from saved discussions"); qc.invalidateQueries({ queryKey: ["forum-feed"] }); }, onError: fail });
  const resolve = useMutation({ mutationFn: () => api.resolveThread(t.id, !t.resolved), onSuccess: result => { apply(result); qc.invalidateQueries({ queryKey: ["forum-feed"] }); toast(result.resolved ? "Question marked resolved" : "Question reopened"); }, onError: fail });
  const withUser = (action: () => void) => {
    if (!user) { toast("Sign in to join the conversation"); router.push("/auth/sign-in"); return; }
    action();
  };
  const share = async () => {
    const link = `${process.env.EXPO_PUBLIC_BACKEND_URL?.replace(/\/$/, "")}/thread/${encodeURIComponent(t.id)}`;
    try {
      if (Platform.OS === "web") { await Clipboard.setStringAsync(link); toast("Discussion link copied"); }
      else await Share.share({ message: `${t.title || t.text.slice(0, 100)}\n${link}`, ...(Platform.OS === "ios" ? { url: link } : {}) });
    } catch { toast("Could not share this discussion. Please try again."); }
  };
  return { like, bookmark, resolve, withUser, share };
}