import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { MessageBlock } from "@/lib/agent/blocks";
import { answerQuestion } from "@/lib/agent/demo-agent";
import type { FinancialSnapshot } from "@/lib/finance/types";

export interface ConversationSummary {
  id: string;
  title: string;
  updated_at: string;
  data_source: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  blocks: MessageBlock[];
  created_at: string;
}

export const MAX_QUESTION_LENGTH = 2000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const conversationsQuery = queryOptions({
  queryKey: ["conversations"],
  queryFn: async (): Promise<ConversationSummary[]> => {
    const { data, error } = await supabase
      .from("conversations")
      .select("id, title, updated_at, data_source")
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return data;
  },
});

export const threadQuery = (conversationId: string) =>
  queryOptions({
    queryKey: ["thread", conversationId],
    queryFn: async (): Promise<{ conversation: ConversationSummary | null; messages: ChatMessage[] }> => {
      if (!UUID.test(conversationId)) return { conversation: null, messages: [] };
      const [conv, msgs] = await Promise.all([
        supabase.from("conversations").select("id, title, updated_at, data_source").eq("id", conversationId).maybeSingle(),
        supabase
          .from("messages")
          .select("id, role, content, blocks, created_at")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true }),
      ]);
      if (conv.error) throw conv.error;
      if (msgs.error) throw msgs.error;
      return {
        conversation: conv.data,
        messages: (msgs.data ?? []).map((m) => ({
          id: m.id,
          role: m.role === "user" ? "user" : "assistant",
          content: m.content,
          blocks: (Array.isArray(m.blocks) ? m.blocks : []) as unknown as MessageBlock[],
          created_at: m.created_at,
        })),
      };
    },
  });

export function titleFromQuestion(q: string): string {
  const clean = q.replace(/\s+/g, " ").trim();
  return clean.length > 60 ? `${clean.slice(0, 57).trimEnd()}…` : clean || "Nova conversa";
}

export async function createConversation(firstQuestion: string, origin: FinancialSnapshot["origin"]): Promise<string> {
  const { data, error } = await supabase
    .from("conversations")
    .insert({ title: titleFromQuestion(firstQuestion), data_source: origin })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

/** Stores the question, computes the answer from the snapshot and stores it too. */
export async function sendMessage(conversationId: string, question: string, snapshot: FinancialSnapshot, today: string) {
  const text = question.trim().slice(0, MAX_QUESTION_LENGTH);
  const { error: e1 } = await supabase.from("messages").insert({ conversation_id: conversationId, role: "user", content: text });
  if (e1) throw e1;
  const answer = answerQuestion(text, snapshot, today);
  const { error: e2 } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    role: "assistant",
    content: answer.content,
    blocks: answer.blocks as unknown as Json,
  });
  if (e2) throw e2;
  // Touches updated_at so the conversation moves to the top of the history.
  await supabase.from("conversations").update({ data_source: snapshot.origin }).eq("id", conversationId);
}

export async function deleteConversation(conversationId: string) {
  const { error } = await supabase.from("conversations").delete().eq("id", conversationId);
  if (error) throw error;
}
