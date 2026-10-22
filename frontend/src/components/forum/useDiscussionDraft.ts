import { useEffect, useState } from "react";
import { storage } from "@/src/utils/storage";

export type DiscussionDraft = { title: string; text: string; tag: string; county: string };
export function useDiscussionDraft(userId?: string, county?: string) {
  const [draft, setDraft] = useState<DiscussionDraft>({ title: "", text: "", tag: "Question", county: county || "" });
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [published, setPublished] = useState(false);
  const key = `mqulima-forum-draft-${userId}`;
  useEffect(() => {
    if (!userId) return;
    let active = true;
    storage.getItem(key, "").then(raw => {
      if (!active) return;
      try { if (raw) setDraft(JSON.parse(raw)); else setDraft({ title: "", text: "", tag: "Question", county: county || "" }); } catch {}
      setLoaded(true);
    }).catch(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, [key, userId, county]);
  useEffect(() => {
    if (!loaded || published) return;
    let active = true;
    setSaved(false);
    storage.setItem(key, JSON.stringify(draft)).then(() => { if (active) setSaved(true); }).catch(() => {});
    return () => { active = false; };
  }, [draft, key, loaded, published]);
  const clear = async () => { setPublished(true); await storage.removeItem(key).catch(() => {}); };
  return { draft, update: (patch: Partial<DiscussionDraft>) => setDraft(old => ({ ...old, ...patch })), loaded, saved, clear };
}