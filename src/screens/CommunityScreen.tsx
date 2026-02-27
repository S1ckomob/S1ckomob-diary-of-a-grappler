import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useSession } from "../hooks/useSession";
import type { Profile, Belt } from "../types";

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

const beltColors: Record<Belt, string> = {
  white: "#E8E8E8",
  blue: "#1A5CCF",
  purple: "#7B2D8E",
  brown: "#6B3A2A",
  black: "#1C1C1E",
};

// --- Helpers ---

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function beltLabel(belt: Belt, stripes: number): string {
  const b = belt.charAt(0).toUpperCase() + belt.slice(1);
  if (stripes === 0) return b;
  return `${b} \u00B7 ${stripes}${stripes === 1 ? " stripe" : " stripes"}`;
}

interface MemberWithStats extends Profile {
  sessionCount: number;
  totalMinutes: number;
}

// --- Leaderboard Podium ---

function PodiumCard({
  member,
  rank,
  metric,
  metricLabel,
}: {
  member: MemberWithStats;
  rank: number;
  metric: number;
  metricLabel: string;
}) {
  const beltColor = beltColors[(member.belt as Belt) || "white"];
  const isFirst = rank === 1;

  return (
    <View style={[podiumStyles.card, isFirst && podiumStyles.cardFirst]}>
      <Text style={podiumStyles.rank}>
        {rank === 1 ? "\u{1F947}" : rank === 2 ? "\u{1F948}" : "\u{1F949}"}
      </Text>
      <View style={[podiumStyles.avatar, { borderColor: beltColor }]}>
        <Text style={podiumStyles.avatarText}>
          {getInitials(member.name)}
        </Text>
      </View>
      <Text style={podiumStyles.name} numberOfLines={1}>
        {member.name || "Grappler"}
      </Text>
      <Text style={podiumStyles.metric}>{metric}</Text>
      <Text style={podiumStyles.metricLabel}>{metricLabel}</Text>
    </View>
  );
}

const podiumStyles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardFirst: {
    borderColor: colors.gold + "40",
    backgroundColor: colors.surfaceRaised,
  },
  rank: {
    fontSize: 20,
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    marginBottom: 8,
  },
  avatarText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 14,
    color: colors.textPrimary,
  },
  name: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    color: colors.textPrimary,
    marginBottom: 4,
    textAlign: "center",
  },
  metric: {
    fontFamily: "DMSans_700Bold",
    fontSize: 18,
    color: colors.gold,
  },
  metricLabel: {
    fontFamily: "DMSans_400Regular",
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
});

// --- Member Row ---

function MemberRow({
  member,
  isYou,
}: {
  member: MemberWithStats;
  isYou: boolean;
}) {
  const beltColor = beltColors[(member.belt as Belt) || "white"];
  const hours = member.totalMinutes >= 60
    ? `${Math.round(member.totalMinutes / 60)}h`
    : `${member.totalMinutes}m`;

  return (
    <View style={memberStyles.row}>
      <View style={[memberStyles.avatar, { borderColor: beltColor }]}>
        <Text style={memberStyles.avatarText}>
          {getInitials(member.name)}
        </Text>
      </View>
      <View style={memberStyles.info}>
        <View style={memberStyles.nameRow}>
          <Text style={memberStyles.name}>
            {member.name || "Grappler"}
          </Text>
          {isYou && (
            <View style={memberStyles.youBadge}>
              <Text style={memberStyles.youText}>You</Text>
            </View>
          )}
        </View>
        <Text style={memberStyles.belt}>
          {beltLabel((member.belt as Belt) || "white", member.stripes)}
        </Text>
      </View>
      <View style={memberStyles.stats}>
        <Text style={memberStyles.statValue}>{member.sessionCount}</Text>
        <Text style={memberStyles.statLabel}>sessions</Text>
      </View>
      <View style={memberStyles.stats}>
        <Text style={memberStyles.statValue}>{hours}</Text>
        <Text style={memberStyles.statLabel}>mat time</Text>
      </View>
    </View>
  );
}

const memberStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    marginRight: 12,
  },
  avatarText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 14,
    color: colors.textPrimary,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: colors.textPrimary,
  },
  youBadge: {
    backgroundColor: colors.accent + "20",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  youText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 10,
    color: colors.accent,
  },
  belt: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  stats: {
    alignItems: "center",
    marginLeft: 12,
  },
  statValue: {
    fontFamily: "DMSans_700Bold",
    fontSize: 15,
    color: colors.gold,
  },
  statLabel: {
    fontFamily: "DMSans_400Regular",
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
});

// --- No Gym State ---

function NoGymState() {
  return (
    <View style={noGymStyles.container}>
      <Text style={noGymStyles.icon}>{"\u{1F91D}"}</Text>
      <Text style={noGymStyles.title}>Join a gym to connect</Text>
      <Text style={noGymStyles.subtitle}>
        The community tab shows your gym teammates, leaderboards, and training
        activity. Join a gym from the Coach tab to get started.
      </Text>
    </View>
  );
}

const noGymStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  icon: {
    fontSize: 56,
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

type TabKey = "month" | "all";

export default function CommunityScreen() {
  const { session: authSession } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [members, setMembers] = useState<MemberWithStats[]>([]);
  const [gymName, setGymName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<TabKey>("month");

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const fetchData = useCallback(async () => {
    if (!authSession?.user) return;
    const userId = authSession.user.id;

    // Get own profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!profileData || !profileData.gym_id) {
      setProfile(profileData as Profile | null);
      setGymName(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    setProfile(profileData as Profile);

    // Fetch gym name
    const { data: gymData } = await supabase
      .from("gyms")
      .select("name")
      .eq("id", profileData.gym_id)
      .single();

    if (gymData) setGymName(gymData.name);

    // Fetch gym members
    const { data: membersData } = await supabase
      .from("profiles")
      .select("*")
      .eq("gym_id", profileData.gym_id)
      .order("name");

    if (!membersData) {
      setMembers([]);
      setLoading(false);
      return;
    }

    // Fetch sessions for all gym members
    const memberIds = membersData.map((m) => m.id);
    const { data: sessionsData } = await supabase
      .from("sessions")
      .select("user_id, duration_minutes, date")
      .in("user_id", memberIds);

    // Aggregate stats
    const statsMap = new Map<
      string,
      { sessionCount: number; totalMinutes: number; monthSessions: number; monthMinutes: number }
    >();

    for (const s of sessionsData || []) {
      const prev = statsMap.get(s.user_id) || {
        sessionCount: 0,
        totalMinutes: 0,
        monthSessions: 0,
        monthMinutes: 0,
      };
      prev.sessionCount++;
      prev.totalMinutes += s.duration_minutes || 0;
      if (s.date >= monthStart) {
        prev.monthSessions++;
        prev.monthMinutes += s.duration_minutes || 0;
      }
      statsMap.set(s.user_id, prev);
    }

    const enriched: MemberWithStats[] = membersData.map((m) => {
      const s = statsMap.get(m.id);
      return {
        ...(m as Profile),
        sessionCount: s?.sessionCount || 0,
        totalMinutes: s?.totalMinutes || 0,
        monthSessions: s?.monthSessions || 0,
        monthMinutes: s?.monthMinutes || 0,
      } as MemberWithStats & { monthSessions: number; monthMinutes: number };
    });

    setMembers(enriched);
    setLoading(false);
  }, [authSession?.user, monthStart]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Sort by sessions descending for the selected period
  const sorted = useMemo(() => {
    return [...members].sort((a, b) => {
      if (tab === "month") {
        return (
          ((b as unknown as Record<string, number>).monthSessions || b.sessionCount) -
          ((a as unknown as Record<string, number>).monthSessions || a.sessionCount)
        );
      }
      return b.sessionCount - a.sessionCount;
    });
  }, [members, tab]);

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  const sections =
    rest.length > 0 ? [{ title: "All Members", data: rest }] : [];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!profile?.gym_id) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community</Text>
        </View>
        <NoGymState />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
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
              <Text style={styles.headerTitle}>Community</Text>
              <Text style={styles.headerCount}>
                {members.length} member{members.length !== 1 ? "s" : ""}
              </Text>
            </View>

            {/* Gym name */}
            <View style={styles.gymBanner}>
              <Text style={styles.gymIcon}>{"\u{1F3E0}"}</Text>
              <Text style={styles.gymName}>{gymName}</Text>
            </View>

            {/* Tab toggle */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tab, tab === "month" && styles.tabActive]}
                onPress={() => setTab("month")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabText,
                    tab === "month" && styles.tabTextActive,
                  ]}
                >
                  This Month
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, tab === "all" && styles.tabActive]}
                onPress={() => setTab("all")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabText,
                    tab === "all" && styles.tabTextActive,
                  ]}
                >
                  All Time
                </Text>
              </TouchableOpacity>
            </View>

            {/* Podium */}
            {top3.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Leaderboard</Text>
                <View style={styles.podiumRow}>
                  {top3.map((m, i) => (
                    <PodiumCard
                      key={m.id}
                      member={m}
                      rank={i + 1}
                      metric={
                        tab === "month"
                          ? (m as unknown as Record<string, number>)
                              .monthSessions || m.sessionCount
                          : m.sessionCount
                      }
                      metricLabel="sessions"
                    />
                  ))}
                </View>
              </>
            )}
          </>
        }
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionLabel}>{title}</Text>
        )}
        renderItem={({ item }) => (
          <MemberRow
            member={item}
            isYou={item.id === authSession?.user?.id}
          />
        )}
        ListEmptyComponent={
          top3.length === 0 ? (
            <View style={emptyStyles.container}>
              <Text style={emptyStyles.text}>
                No teammates yet. Share your gym code to invite others.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: 24,
    paddingHorizontal: 40,
  },
  text: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
  },
});

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

  // Header
  header: {
    paddingTop: 60,
    paddingBottom: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  headerTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 26,
    color: colors.textPrimary,
  },
  headerCount: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textMuted,
  },

  // Gym banner
  gymBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  gymIcon: {
    fontSize: 18,
  },
  gymName: {
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: colors.textPrimary,
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.gold,
  },
  tabText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.gold,
  },

  // Section
  sectionLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 4,
  },

  // Podium
  podiumRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
});
