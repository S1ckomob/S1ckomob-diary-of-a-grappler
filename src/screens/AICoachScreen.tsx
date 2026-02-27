import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import { useSession } from "../hooks/useSession";
import type { Profile, Goal, Session } from "../types";

// --- Theme ---

const colors = {
  background: "#08080D",
  surface: "#11111A",
  surfaceRaised: "#1A1A26",
  accent: "#C41E3A",
  gold: "#C9A84C",
  green: "#2D8E4E",
  textPrimary: "#FFFFFF",
  textSecondary: "#9A9AA0",
  textMuted: "#5A5A64",
  border: "#1E1E2A",
};

// --- Types ---

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface DnaScore {
  label: string;
  key: string;
  value: number;
}

// --- Helpers ---

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY ?? "";

function getDnaScores(profile: Profile): DnaScore[] {
  return [
    { label: "Guard", key: "dna_guard", value: profile.dna_guard },
    { label: "Passing", key: "dna_passing", value: profile.dna_passing },
    { label: "Submissions", key: "dna_submissions", value: profile.dna_submissions },
    { label: "Takedowns", key: "dna_takedowns", value: profile.dna_takedowns },
    { label: "Escapes", key: "dna_escapes", value: profile.dna_escapes },
  ];
}

function getWeakAreas(profile: Profile): DnaScore[] {
  const scores = getDnaScores(profile);
  return scores.sort((a, b) => a.value - b.value).slice(0, 3);
}

function buildStarterQuestions(profile: Profile): string[] {
  const weak = getWeakAreas(profile);
  const belt = profile.belt;

  const questionMap: Record<string, string> = {
    Guard: `My guard game is weak at ${belt} belt. What are the best drills to improve retention and sweeps?`,
    Passing: `I struggle with guard passing as a ${belt} belt. What's a simple system I can follow?`,
    Submissions: `How can I finish more submissions? I'm a ${belt} belt and my sub rate is low.`,
    Takedowns: `What takedowns should a ${belt} belt focus on to feel confident standing?`,
    Escapes: `I get stuck on bottom a lot. What escape sequences should I drill as a ${belt} belt?`,
  };

  return weak.map((area) => questionMap[area.label]);
}

function buildSystemPrompt(
  profile: Profile,
  goals: Goal[],
  recentSessions: Session[]
): string {
  const dna = getDnaScores(profile);
  const dnaText = dna.map((d) => `${d.label}: ${d.value}/100`).join(", ");

  const goalsText =
    goals.length > 0
      ? goals
          .map(
            (g) =>
              `- ${g.goal_type}${g.description ? `: ${g.description}` : ""} (${g.current}/${g.target ?? "?"}${g.unit ? ` ${g.unit}` : ""}${g.completed ? " - DONE" : ""})`
          )
          .join("\n")
      : "No current goals set.";

  const sessionsText =
    recentSessions.length > 0
      ? recentSessions
          .slice(0, 10)
          .map(
            (s) =>
              `- ${s.date} | ${s.session_type} | ${s.duration_minutes ?? "?"}min | Taps given: ${s.taps_given}, received: ${s.taps_received}${s.notes ? ` | Notes: ${s.notes}` : ""}`
          )
          .join("\n")
      : "No recent sessions logged.";

  return `You are an elite BJJ coach assistant inside the "Diary of a Grappler" app. You give personalized, actionable BJJ advice.

ATHLETE PROFILE:
- Name: ${profile.name ?? "Unknown"}
- Belt: ${profile.belt} (${profile.stripes} stripes)
- Weight class: ${profile.weight_class ?? "Not set"}
- Trains: ${[profile.gi && "Gi", profile.nogi && "No-Gi"].filter(Boolean).join(" & ") || "Not specified"}
- Training goals: ${profile.training_goals ?? "Not set"}

GAME DNA (0–100 scale):
${dnaText}

CURRENT MONTH GOALS:
${goalsText}

RECENT SESSIONS (last 10):
${sessionsText}

INSTRUCTIONS:
- Give concise, practical advice tailored to this athlete's belt level and DNA scores.
- Reference their weak areas and suggest specific techniques, drills, and concepts.
- When discussing techniques, name them specifically (e.g. "hip escape from mount" not "work on escapes").
- Keep responses focused and under 300 words unless the question requires more detail.
- Use a supportive but direct coaching tone. No fluff.
- If asked about injuries or medical topics, recommend they see a professional.`;
}

let nextId = 1;
function makeId(): string {
  return `msg_${nextId++}`;
}

// --- Typing Indicator ---

function TypingIndicator() {
  return (
    <View style={[bubbleStyles.row, bubbleStyles.rowLeft]}>
      <View style={[bubbleStyles.bubble, bubbleStyles.bubbleAI]}>
        <View style={typingStyles.container}>
          <View style={[typingStyles.dot, typingStyles.dot1]} />
          <View style={[typingStyles.dot, typingStyles.dot2]} />
          <View style={[typingStyles.dot, typingStyles.dot3]} />
        </View>
      </View>
    </View>
  );
}

const typingStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.textMuted,
  },
  dot1: { opacity: 0.4 },
  dot2: { opacity: 0.6 },
  dot3: { opacity: 0.8 },
});

// --- Chat Bubble ---

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <View
      style={[
        bubbleStyles.row,
        isUser ? bubbleStyles.rowRight : bubbleStyles.rowLeft,
      ]}
    >
      <View
        style={[
          bubbleStyles.bubble,
          isUser ? bubbleStyles.bubbleUser : bubbleStyles.bubbleAI,
        ]}
      >
        <Text
          style={[
            bubbleStyles.text,
            isUser ? bubbleStyles.textUser : bubbleStyles.textAI,
          ]}
        >
          {message.content}
        </Text>
      </View>
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  rowRight: {
    alignItems: "flex-end",
  },
  rowLeft: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleUser: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: colors.surfaceRaised,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    lineHeight: 22,
  },
  textUser: {
    color: colors.textPrimary,
  },
  textAI: {
    color: colors.textPrimary,
  },
});

// --- Starter Question Card ---

function StarterCard({
  question,
  onPress,
}: {
  question: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={starterStyles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={starterStyles.text} numberOfLines={2}>
        {question}
      </Text>
      <Ionicons
        name="arrow-forward-circle"
        size={18}
        color={colors.accent}
        style={starterStyles.icon}
      />
    </TouchableOpacity>
  );
}

const starterStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  icon: {
    marginLeft: 10,
  },
});

// --- Main Screen ---

export default function AICoachScreen() {
  const navigation = useNavigation();
  const { session: authSession } = useSession();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const systemPromptRef = useRef<string>("");

  // --- Load user context ---

  const fetchContext = useCallback(async () => {
    if (!authSession?.user) return;
    const userId = authSession.user.id;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const [profileRes, goalsRes, sessionsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase
        .from("goals")
        .select("*")
        .eq("user_id", userId)
        .eq("month", month)
        .eq("year", year)
        .order("created_at", { ascending: true }),
      supabase
        .from("sessions")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(10),
    ]);

    const p = profileRes.data as Profile | null;
    const g = (goalsRes.data ?? []) as Goal[];
    const s = (sessionsRes.data ?? []) as Session[];

    if (p) {
      setProfile(p);
      setGoals(g);
      setRecentSessions(s);
      systemPromptRef.current = buildSystemPrompt(p, g, s);
    }
    setLoading(false);
  }, [authSession?.user]);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  // --- Send message ---

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || sending) return;

      const userMsg: ChatMessage = {
        id: makeId(),
        role: "user",
        content: text.trim(),
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput("");
      setSending(true);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      try {
        const apiMessages = updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await fetch(ANTHROPIC_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_KEY,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1024,
            system: systemPromptRef.current,
            messages: apiMessages,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`API error ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const assistantText =
          data.content?.[0]?.text ?? "Sorry, I couldn't generate a response.";

        const assistantMsg: ChatMessage = {
          id: makeId(),
          role: "assistant",
          content: assistantText,
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        const errorMsg: ChatMessage = {
          id: makeId(),
          role: "assistant",
          content: `Something went wrong. Please try again.\n\n${errorMessage}`,
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setSending(false);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    },
    [messages, sending]
  );

  // --- Starters ---

  const starterQuestions = profile ? buildStarterQuestions(profile) : [];
  const showStarters = messages.length === 0 && !loading;

  // --- Render ---

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>AI Coach</Text>
          <Text style={styles.headerSubtitle}>Powered by Claude</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatBubble message={item} />}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          showStarters ? (
            <View style={styles.startersSection}>
              <View style={styles.welcomeCard}>
                <Text style={styles.welcomeEmoji}>{"\u{1F94B}"}</Text>
                <Text style={styles.welcomeTitle}>
                  Hey{profile?.name ? `, ${profile.name}` : ""}!
                </Text>
                <Text style={styles.welcomeSubtitle}>
                  I know your game DNA, goals, and recent training. Ask me
                  anything about BJJ and I'll give you personalized advice.
                </Text>
              </View>
              <Text style={styles.startersLabel}>SUGGESTED QUESTIONS</Text>
              {starterQuestions.map((q, i) => (
                <StarterCard
                  key={i}
                  question={q}
                  onPress={() => sendMessage(q)}
                />
              ))}
            </View>
          ) : null
        }
        ListFooterComponent={sending ? <TypingIndicator /> : null}
        onContentSizeChange={() => {
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }}
      />

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Ask your AI coach..."
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={2000}
          editable={!sending}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!input.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || sending}
          activeOpacity={0.7}
        >
          <Ionicons
            name="send"
            size={20}
            color={
              input.trim() && !sending
                ? colors.textPrimary
                : colors.textMuted
            }
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 18,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Messages
  messageList: {
    paddingTop: 16,
    paddingBottom: 8,
  },

  // Starters
  startersSection: {
    paddingBottom: 16,
  },
  welcomeCard: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 28,
  },
  welcomeEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  welcomeTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  startersLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 1,
    paddingHorizontal: 16,
    marginBottom: 10,
    marginTop: 8,
  },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 34 : 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: colors.textPrimary,
    maxHeight: 120,
    lineHeight: 20,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceRaised,
  },
});
