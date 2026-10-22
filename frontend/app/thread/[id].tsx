import React, { useRef, useState } from "react";
import { ActivityIndicator, FlatList, Platform, Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lucide } from "@react-native-vector-icons/lucide";
import { ListSkeleton } from "@/src/components/Skeleton";
import { ThreadCard } from "@/src/components/ThreadCard";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { useApp } from "@/src/store/AppStore";
import { api, ApiThread } from "@/src/services/api";
import { Comment } from "@/src/data/forum";
import { ForumState, ForumToolbar } from "@/src/components/forum/ForumUI";
import { ReplyCard } from "@/src/components/forum/ReplyCard";
import { useThreadActions } from "@/src/components/forum/useThreadActions";

function ResolveQuestion({ t }: { t: ApiThread }) {
  const s = useStyles();
  const { colors } = useTheme();
  const { user } = useApp();
  const { resolve } = useThreadActions(t);
  if (t.tag !== "Question" || !user || user.id !== t.user_id) return null;
  return <Pressable testID="thread-resolve-button" disabled={resolve.isPending} accessibilityState={{ selected: !!t.resolved, disabled: resolve.isPending }} onPress={() => resolve.mutate()} style={s.resolve}>{resolve.isPending ? <ActivityIndicator size="small" color={colors.brand} /> : <Lucide name={t.resolved ? "rotate-ccw" : "circle-check"} size={18} color={colors.brand} />}<View style={s.resolveBody}><Text testID="thread-resolve-label" style={s.resolveTitle}>{t.resolved ? "Question resolved · Reopen" : "Got the help you needed?"}</Text><Text style={s.meta}>{t.resolved ? "Tap if you still need advice." : "Mark your question as resolved."}</Text></View><Lucide name="chevron-right" size={17} color={colors.brand} /></Pressable>;
}

export default function ThreadDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { user, ready, toast } = useApp();
  const [text, setText] = useState("");
  const [target, setTarget] = useState<Comment | null>(null);
  const [newest, setNewest] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<TextInput>(null);
  const list = useRef<FlatList<Comment>>(null);
  const scrollAfterPost = useRef(false);
  const q = useQuery({ queryKey: ["thread", id, user?.id], queryFn: () => api.getThread(id), enabled: ready, retry: 1 });
  const t = q.data;
  const comment = useMutation({
    mutationFn: ({ body, parent }: { body: string; parent?: string }) => api.addComment(id, body, parent),
    onSuccess: posted => {
      qc.setQueryData<ApiThread>(["thread", id, user?.id], old => old ? { ...old, comments: [...old.comments, posted] } : old);
      setText(""); setTarget(null); setError(""); toast("Reply posted"); scrollAfterPost.current = !posted.parent_id;
      qc.invalidateQueries({ queryKey: ["forum-feed"] });
      qc.invalidateQueries({ queryKey: ["threads"] });
      qc.invalidateQueries({ queryKey: ["my-threads"] });
    },
    onError: (e: Error) => setError(e.message || "Could not post your reply. Please try again."),
  });
  const replyTo = (c?: Comment) => {
    if (!user) { router.push("/auth/sign-in"); return; }
    setTarget(c ?? null); input.current?.focus();
  };
  const send = () => { if (text.trim() && !comment.isPending) comment.mutate({ body: text.trim(), parent: target?.parent_id || target?.id }); };
  const roots = t?.comments.filter(c => !c.parent_id) ?? [];
  if (newest) roots.reverse();
  return <View style={s.root} testID="thread-detail-screen"><ForumToolbar title="Discussion" />
    {!ready || q.isPending ? <View style={s.loading} testID="thread-loading"><ListSkeleton count={2} height={220} /></View> : q.isError ? <ForumState testID="thread-error" icon="wifi-off" title="Couldn’t load this discussion" description="Check your connection and give it another try." action="Try again" onPress={() => q.refetch()} /> : !t ? <ForumState testID="thread-not-found" title="Discussion not found" description="This conversation may no longer be available." action="Back to the community" onPress={() => router.replace("/(tabs)/forum")} /> : <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : "translate-with-padding"}>
      <FlatList ref={list} testID="thread-replies-list" data={roots} keyExtractor={c => c.id} keyboardShouldPersistTaps="handled" contentContainerStyle={s.list} refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.brand} />} onContentSizeChange={() => { if (scrollAfterPost.current) { scrollAfterPost.current = false; if (newest) list.current?.scrollToOffset({ offset: 0, animated: true }); else list.current?.scrollToEnd({ animated: true }); } }}
        ListHeaderComponent={<View><ThreadCard t={t} full onReply={() => replyTo()} /><ResolveQuestion t={t} /><View style={s.repliesHeading}><View style={s.replyHeadingLabel}><Text style={s.heading}>The conversation</Text><Text testID="thread-comment-count" style={s.count}>{t.comments.length}</Text></View><Pressable testID="thread-reply-sort" accessibilityLabel={newest ? "Show oldest replies first" : "Show newest replies first"} onPress={() => setNewest(!newest)} style={s.sort}><Text testID="thread-reply-sort-label" style={s.meta}>{newest ? "Newest" : "Oldest"}</Text><Lucide name="arrow-down-up" size={13} color={colors.muted} /></Pressable></View></View>}
        ListEmptyComponent={<ForumState testID="thread-empty-replies" icon="messages-square" title="Every answer starts somewhere" description="Have some experience to share? Be the first to help this farmer." action="Write the first reply" onPress={() => replyTo()} />}
        renderItem={({ item }) => <View style={s.replyGroup}><ReplyCard comment={item} authorId={t.user_id} onReply={() => replyTo(item)} />{t.comments.filter(c => c.parent_id === item.id).map(child => <ReplyCard key={child.id} comment={child} authorId={t.user_id} nested onReply={() => replyTo(child)} />)}</View>}
      />
      <View style={[s.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {!user ? <Pressable testID="thread-sign-in-reply" onPress={() => router.push("/auth/sign-in")} style={s.signIn}><Lucide name="message-circle" size={20} color={colors.brand} /><Text style={s.signInText}>Sign in to join the conversation</Text><Lucide name="arrow-right" size={18} color={colors.brand} /></Pressable> : <>
          {target && <View testID="thread-reply-target" style={s.target}><Text testID="thread-reply-target-name" style={s.meta}>Replying to {target.author}</Text><Pressable testID="thread-reply-cancel" accessibilityLabel="Cancel targeted reply" onPress={() => setTarget(null)} style={s.cancel}><Lucide name="x" size={17} color={colors.muted} /></Pressable></View>}
          {!!error && <Text testID="thread-comment-error" accessibilityRole="alert" style={s.error}>{error}</Text>}
          <View style={s.inputRow}><TextInput ref={input} testID="thread-comment-input" accessibilityLabel="Write your reply" value={text} onChangeText={v => { setText(v); setError(""); }} placeholder={target ? `Reply to ${target.author.split(" ")[0]}…` : "Share a helpful reply…"} placeholderTextColor={colors.muted} style={s.input} multiline maxLength={1000} editable={!comment.isPending} /><Pressable testID="thread-comment-send" accessibilityLabel="Send reply" accessibilityState={{ disabled: !text.trim() || comment.isPending }} onPress={send} disabled={!text.trim() || comment.isPending} style={[s.send, (!text.trim() || comment.isPending) && s.disabled]}>{comment.isPending ? <ActivityIndicator size="small" color={colors.onBrand} /> : <Lucide name="arrow-up" size={21} color={colors.onBrand} />}</Pressable></View>
          {text.length > 850 && <Text testID="thread-reply-character-count" style={s.meta}>{text.length} / 1,000</Text>}
        </>}
      </View>
    </KeyboardAvoidingView>}
  </View>;
}

const useStyles = makeStyles(c => ({
  root: { flex: 1, backgroundColor: c.surface },
  flex: { flex: 1 },
  loading: { padding: 20 },
  list: { paddingBottom: 28 },
  resolve: { flexDirection: "row", alignItems: "center", gap: 10, margin: 16, padding: 14, borderRadius: 14, backgroundColor: c.brandTertiary, minHeight: 64 },
  resolveBody: { flex: 1, gap: 4 },
  resolveTitle: { fontFamily: fonts.b700, fontSize: 12, color: c.brand },
  meta: { fontFamily: fonts.b500, fontSize: 10, color: c.muted },
  repliesHeading: { flexDirection: "row", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6, alignItems: "center", justifyContent: "space-between", gap: 8 },
  replyHeadingLabel: { flexDirection: "row", gap: 8, alignItems: "center", flex: 1, flexWrap: "wrap" },
  heading: { fontFamily: fonts.h700, fontSize: 20, color: c.onSurface },
  count: { fontFamily: fonts.b700, fontSize: 11, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: c.brandTertiary, color: c.onBrandTertiary },
  sort: { flexDirection: "row", gap: 5, minHeight: 44, alignItems: "center" },
  replyGroup: { marginHorizontal: 16, marginTop: 12, backgroundColor: c.surfaceSecondary, borderRadius: 18, borderWidth: 1, borderColor: c.border, paddingBottom: 4 },
  composer: { backgroundColor: c.surfaceSecondary, borderTopWidth: 1, borderTopColor: c.border, paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  inputRow: { flexDirection: "row", gap: 10, alignItems: "flex-end" },
  input: { flex: 1, minHeight: 48, maxHeight: 130, backgroundColor: c.heroBg, borderWidth: 1, borderColor: c.border, borderRadius: 24, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, fontFamily: fonts.b400, fontSize: 13, color: c.onSurface },
  send: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.brand, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.4 },
  target: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderLeftWidth: 2, borderLeftColor: c.brand, paddingLeft: 10 },
  cancel: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  error: { fontFamily: fonts.b500, fontSize: 12, lineHeight: 18, color: c.error },
  signIn: { flexDirection: "row", gap: 10, alignItems: "center", minHeight: 48 },
  signInText: { flex: 1, fontFamily: fonts.b600, fontSize: 12, color: c.brand },
}));