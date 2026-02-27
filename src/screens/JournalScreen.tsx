import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useSession } from "../hooks/useSession";
import type { Profile, Session, Belt } from "../types";
import type { JournalStackParamList } from "../navigation";

// --- Theme ---

const colors = {
  background: "#08080D",
  surface: "#11111A",
  accent: "#C41E3A",
  gold: "#C9A84C",
  textPrimary: "#FFFFFF",
  textSecondary: "#9A9AA0",
  textMuted: "#5A5A64",
  border: "#1E1E2A",
};

const beltColors: Record<Belt, string> = {
  white: "#E8E8E8",
  blue: "#1A5CCF",
  purple: "#7B2D8E",
  brown: "#6B3A2A",
  black: "#1C1C1E",
};

// --- Helpers ---

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const diffDays = Math.round(
    (today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)
    return date.toLocaleDateString("en-US", { weekday: "long" });

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return "--";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function sessionTypeLabel(type: string): string {
  switch (type) {
    case "rolling":
      return "Rolling";
    case "drilling":
      return "Drilling";
    case "competition":
      return "Competition";
    default:
      return type;
  }
}

function sessionTypeIcon(type: string): string {
  switch (type) {
    case "rolling":
      return "\u{1F94B}";
    case "drilling":
      return "\u{1F527}";
    case "competition":
      return "\u{1F3C6}";
    default:
      return "\u{1F4DD}";
  }
}

function calculateStreak(sessions: Session[]): number {
  if (sessions.length === 0) return 0;

  const uniqueDates = [
    ...new Set(sessions.map((s) => s.date)),
  ].sort((a, b) => (a > b ? -1 : 1));

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, "0")}-${String(yesterdayDate.getDate()).padStart(2, "0")}`;

  // Streak must include today or yesterday to be active
  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const current = new Date(uniqueDates[i - 1] + "T00:00:00");
    const prev = new Date(uniqueDates[i] + "T00:00:00");
    const diffMs = current.getTime() - prev.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// --- Belt Badge ---

function BeltBadge({ belt, stripes }: { belt: Belt; stripes: number }) {
  const color = beltColors[belt] || beltColors.white;
  const displayStripes = Math.min(stripes, 4);

  return (
    <View style={badgeStyles.container}>
      <View style={[badgeStyles.belt, { backgroundColor: color }]}>
        {belt === "black" && (
          <View style={badgeStyles.blackBeltBar} />
        )}
      </View>
      {displayStripes > 0 && (
        <View style={badgeStyles.stripes}>
          {Array.from({ length: displayStripes }).map((_, i) => (
            <View key={i} style={badgeStyles.stripe} />
          ))}
        </View>
      )}
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  belt: {
    width: 36,
    height: 12,
    borderRadius: 3,
    overflow: "hidden",
    justifyContent: "center",
  },
  blackBeltBar: {
    position: "absolute",
    right: 4,
    width: 8,
    height: 12,
    backgroundColor: "#8B0000",
  },
  stripes: {
    flexDirection: "row",
    gap: 2,
  },
  stripe: {
    width: 3,
    height: 10,
    backgroundColor: colors.textPrimary,
    borderRadius: 1,
  },
});

// --- Session Card ---

function SessionCard({ session }: { session: Session }) {
  return (
    <View style={cardStyles.container}>
      <View style={cardStyles.header}>
        <Text style={cardStyles.icon}>{sessionTypeIcon(session.session_type)}</Text>
        <View style={cardStyles.headerText}>
          <Text style={cardStyles.type}>
            {sessionTypeLabel(session.session_type)}
          </Text>
          <Text style={cardStyles.date}>{formatDate(session.date)}</Text>
        </View>
        <Text style={cardStyles.duration}>
          {formatDuration(session.duration_minutes)}
        </Text>
      </View>
      {session.notes ? (
        <Text style={cardStyles.notes} numberOfLines={2}>
          {session.notes}
        </Text>
      ) : null}
      {(session.rounds || session.taps_given > 0 || session.taps_received > 0) && (
        <View style={cardStyles.stats}>
          {session.rounds ? (
            <Text style={cardStyles.stat}>{session.rounds} rounds</Text>
          ) : null}
          {session.taps_given > 0 && (
            <Text style={cardStyles.stat}>{session.taps_given} subs</Text>
          )}
          {session.taps_received > 0 && (
            <Text style={cardStyles.stat}>{session.taps_received} tapped</Text>
          )}
        </View>
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    fontSize: 22,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  type: {
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: colors.textPrimary,
  },
  date: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 1,
  },
  duration: {
    fontFamily: "DMSans_700Bold",
    fontSize: 15,
    color: colors.gold,
  },
  notes: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 10,
    lineHeight: 20,
  },
  stats: {
    flexDirection: "row",
    gap: 14,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stat: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: colors.textMuted,
  },
});

// --- Empty State ---

function EmptyState() {
  return (
    <View style={emptyStyles.container}>
      <Text style={emptyStyles.icon}>{"\u{1F94B}"}</Text>
      <Text style={emptyStyles.title}>No sessions yet</Text>
      <Text style={emptyStyles.subtitle}>
        Every black belt was once a beginner.{"\n"}Log your first session to
        start tracking your journey.
      </Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontFamily: "DMSans_700Bold",
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});

// --- Main Screen ---

type JournalNav = NativeStackNavigationProp<JournalStackParamList, "JournalHome">;

export default function JournalScreen() {
  const navigation = useNavigation<JournalNav>();
  const { session: authSession } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!authSession?.user) return;
    const userId = authSession.user.id;

    const [profileRes, sessionsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase
        .from("sessions")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(50),
    ]);

    if (profileRes.data) setProfile(profileRes.data as Profile);
    if (sessionsRes.data) setSessions(sessionsRes.data as Session[]);
    setLoading(false);
  }, [authSession?.user]);

  // Fetch on mount / when auth becomes available, and refetch on screen focus
  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener("focus", () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation, fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const streak = calculateStreak(sessions);
  const displayName = profile?.name || authSession?.user?.email?.split("@")[0] || "Grappler";

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <View style={styles.headerLeft}>
                  <Text style={styles.greeting}>
                    {displayName}
                  </Text>
                  <BeltBadge
                    belt={profile?.belt as Belt || "white"}
                    stripes={profile?.stripes ?? 0}
                  />
                </View>
                {streak > 0 && (
                  <View style={styles.streakBadge}>
                    <Text style={styles.streakIcon}>{"\u{1F525}"}</Text>
                    <Text style={styles.streakText}>{streak}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Log Session Button */}
            <TouchableOpacity
              style={styles.logButton}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("LogSession")}
            >
              <Text style={styles.logButtonText}>+ Log Session</Text>
            </TouchableOpacity>

            {/* View Progress */}
            <TouchableOpacity
              style={styles.progressButton}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("Progress")}
            >
              <Ionicons name="stats-chart" size={18} color={colors.accent} />
              <Text style={styles.progressButtonText}>View Progress</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Section label */}
            {sessions.length > 0 && (
              <Text style={styles.sectionLabel}>Recent Sessions</Text>
            )}
          </>
        }
        renderItem={({ item }) => <SessionCard session={item} />}
        ListEmptyComponent={<EmptyState />}
      />
    </View>
  );
}

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
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
    gap: 8,
  },
  greeting: {
    fontFamily: "DMSans_700Bold",
    fontSize: 26,
    color: colors.textPrimary,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  streakIcon: {
    fontSize: 16,
  },
  streakText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: colors.gold,
  },
  logButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  logButtonText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: colors.textPrimary,
  },
  progressButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    gap: 10,
  },
  progressButtonText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  sectionLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
});
