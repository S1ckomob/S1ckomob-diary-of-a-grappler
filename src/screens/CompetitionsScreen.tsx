import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useSession } from "../hooks/useSession";
import type { Competition, CompResult } from "../types";
import type { JournalStackParamList } from "../navigation";

// --- Theme ---

const colors = {
  background: "#08080D",
  surface: "#11111A",
  surfaceRaised: "#1A1A26",
  accent: "#C41E3A",
  gold: "#C9A84C",
  green: "#2D8E4E",
  silver: "#A0A0B0",
  bronze: "#CD7F32",
  textPrimary: "#FFFFFF",
  textSecondary: "#9A9AA0",
  textMuted: "#5A5A64",
  border: "#1E1E2A",
};

const resultColors: Record<string, string> = {
  gold: colors.gold,
  silver: colors.silver,
  bronze: colors.bronze,
  dnp: colors.textMuted,
};

const resultLabels: Record<string, string> = {
  gold: "Gold",
  silver: "Silver",
  bronze: "Bronze",
  dnp: "Did Not Place",
};

const resultEmojis: Record<string, string> = {
  gold: "\u{1F947}",
  silver: "\u{1F948}",
  bronze: "\u{1F949}",
  dnp: "",
};

// --- Helpers ---

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr + "T00:00:00");
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

type CompNav = NativeStackNavigationProp<JournalStackParamList, "Competitions">;

// --- Stats Summary ---

function StatsSummary({ comps }: { comps: Competition[] }) {
  const completed = comps.filter((c) => c.completed);
  const totalComps = completed.length;
  const medals = completed.filter(
    (c) => c.result === "gold" || c.result === "silver" || c.result === "bronze"
  ).length;
  const golds = completed.filter((c) => c.result === "gold").length;
  const totalWon = completed.reduce((s, c) => s + c.matches_won, 0);
  const totalLost = completed.reduce((s, c) => s + c.matches_lost, 0);
  const totalMatches = totalWon + totalLost;
  const winRate = totalMatches > 0 ? Math.round((totalWon / totalMatches) * 100) : 0;

  return (
    <View style={statsStyles.row}>
      <View style={statsStyles.card}>
        <Ionicons name="trophy" size={18} color={colors.gold} />
        <Text style={statsStyles.value}>{totalComps}</Text>
        <Text style={statsStyles.label}>Competitions</Text>
      </View>
      <View style={statsStyles.card}>
        <Text style={statsStyles.emoji}>{"\u{1F3C5}"}</Text>
        <Text style={statsStyles.value}>{medals}</Text>
        <Text style={statsStyles.label}>
          Medals{golds > 0 ? ` (${golds}G)` : ""}
        </Text>
      </View>
      <View style={statsStyles.card}>
        <Ionicons name="stats-chart" size={18} color={colors.green} />
        <Text style={statsStyles.value}>{winRate}%</Text>
        <Text style={statsStyles.label}>
          Win Rate{totalMatches > 0 ? ` (${totalWon}W)` : ""}
        </Text>
      </View>
    </View>
  );
}

const statsStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  emoji: {
    fontSize: 18,
  },
  value: {
    fontFamily: "DMSans_700Bold",
    fontSize: 22,
    color: colors.textPrimary,
  },
  label: {
    fontFamily: "DMSans_400Regular",
    fontSize: 10,
    color: colors.textMuted,
    textAlign: "center",
  },
});

// --- Upcoming Competition Card ---

function UpcomingCard({ comp }: { comp: Competition }) {
  const days = daysUntil(comp.date);
  const daysLabel =
    days === 0 ? "Today!" : days === 1 ? "Tomorrow" : `${days} days`;

  return (
    <View style={upcomingStyles.container}>
      <View style={upcomingStyles.dateCol}>
        <Text style={upcomingStyles.daysNum}>{days <= 0 ? "!" : days}</Text>
        <Text style={upcomingStyles.daysLabel}>
          {days <= 0 ? "Today" : "days"}
        </Text>
      </View>
      <View style={upcomingStyles.info}>
        <Text style={upcomingStyles.name}>{comp.name}</Text>
        <View style={upcomingStyles.metaRow}>
          <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
          <Text style={upcomingStyles.meta}>{formatDate(comp.date)}</Text>
        </View>
        {comp.location && (
          <View style={upcomingStyles.metaRow}>
            <Ionicons name="location-outline" size={12} color={colors.textMuted} />
            <Text style={upcomingStyles.meta}>{comp.location}</Text>
          </View>
        )}
        <View style={upcomingStyles.tagsRow}>
          {comp.division && (
            <View style={upcomingStyles.tag}>
              <Text style={upcomingStyles.tagText}>{comp.division}</Text>
            </View>
          )}
          <View style={upcomingStyles.tag}>
            <Text style={upcomingStyles.tagText}>{comp.gi ? "Gi" : "No-Gi"}</Text>
          </View>
          {comp.weight_class && (
            <View style={upcomingStyles.tag}>
              <Text style={upcomingStyles.tagText}>{comp.weight_class}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const upcomingStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateCol: {
    width: 52,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    backgroundColor: colors.accent + "18",
    borderRadius: 10,
    paddingVertical: 10,
  },
  daysNum: {
    fontFamily: "DMSans_700Bold",
    fontSize: 22,
    color: colors.accent,
  },
  daysLabel: {
    fontFamily: "DMSans_400Regular",
    fontSize: 10,
    color: colors.accent,
    marginTop: 1,
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: "DMSans_500Medium",
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 3,
  },
  meta: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: colors.textMuted,
  },
  tagsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  tag: {
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 11,
    color: colors.textSecondary,
  },
});

// --- Past Competition Card ---

function PastCard({
  comp,
  onMarkResult,
}: {
  comp: Competition;
  onMarkResult: () => void;
}) {
  const rc = comp.result ? resultColors[comp.result] : colors.textMuted;
  const rl = comp.result ? resultLabels[comp.result] : "No result";
  const re = comp.result ? resultEmojis[comp.result] : "";
  const totalMatches = comp.matches_won + comp.matches_lost;

  return (
    <View style={pastStyles.container}>
      <View style={pastStyles.topRow}>
        <View style={pastStyles.info}>
          <Text style={pastStyles.name}>{comp.name}</Text>
          <Text style={pastStyles.date}>{formatDate(comp.date)}</Text>
          {comp.location && (
            <Text style={pastStyles.location}>{comp.location}</Text>
          )}
        </View>
        {comp.result ? (
          <View style={[pastStyles.resultBadge, { backgroundColor: rc + "20" }]}>
            {re ? <Text style={pastStyles.resultEmoji}>{re}</Text> : null}
            <Text style={[pastStyles.resultText, { color: rc }]}>{rl}</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={pastStyles.addResultBtn}
            onPress={onMarkResult}
            activeOpacity={0.7}
          >
            <Text style={pastStyles.addResultText}>Add Result</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Match record + tags */}
      <View style={pastStyles.bottomRow}>
        {totalMatches > 0 && (
          <Text style={pastStyles.record}>
            {comp.matches_won}W - {comp.matches_lost}L
          </Text>
        )}
        <View style={pastStyles.tagsRow}>
          {comp.division && (
            <View style={pastStyles.tag}>
              <Text style={pastStyles.tagText}>{comp.division}</Text>
            </View>
          )}
          <View style={pastStyles.tag}>
            <Text style={pastStyles.tagText}>{comp.gi ? "Gi" : "No-Gi"}</Text>
          </View>
        </View>
      </View>

      {comp.notes && (
        <Text style={pastStyles.notes}>{comp.notes}</Text>
      )}
    </View>
  );
}

const pastStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  info: {
    flex: 1,
    marginRight: 10,
  },
  name: {
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: colors.textPrimary,
  },
  date: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
  },
  location: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  resultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  resultEmoji: {
    fontSize: 14,
  },
  resultText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 12,
  },
  addResultBtn: {
    backgroundColor: colors.accent + "20",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addResultText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    color: colors.accent,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  record: {
    fontFamily: "DMSans_700Bold",
    fontSize: 13,
    color: colors.green,
  },
  tagsRow: {
    flexDirection: "row",
    gap: 6,
  },
  tag: {
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 11,
    color: colors.textSecondary,
  },
  notes: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    fontStyle: "italic",
    lineHeight: 19,
  },
});

// --- Empty State ---

function EmptyState() {
  return (
    <View style={emptyStyles.container}>
      <Text style={emptyStyles.icon}>{"\u{1F3C6}"}</Text>
      <Text style={emptyStyles.title}>No competitions yet</Text>
      <Text style={emptyStyles.subtitle}>
        Add your first competition to start tracking your tournament journey.
      </Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 40,
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontFamily: "DMSans_700Bold",
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});

// --- Mark Result Dialog ---

function showResultDialog(
  comp: Competition,
  onSave: (result: CompResult, won: number, lost: number, notes: string) => void
) {
  // Using Alert.prompt isn't available on Android/web, so use a simple selection
  Alert.alert(
    "Competition Result",
    `How did you do at ${comp.name}?`,
    [
      {
        text: "Gold",
        onPress: () => onSave("gold", 0, 0, ""),
      },
      {
        text: "Silver",
        onPress: () => onSave("silver", 0, 0, ""),
      },
      {
        text: "Bronze",
        onPress: () => onSave("bronze", 0, 0, ""),
      },
      {
        text: "Did Not Place",
        onPress: () => onSave("dnp", 0, 0, ""),
      },
      { text: "Cancel", style: "cancel" },
    ]
  );
}

// --- Main Screen ---

export default function CompetitionsScreen() {
  const navigation = useNavigation<CompNav>();
  const { session: authSession } = useSession();

  const [comps, setComps] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!authSession?.user) return;

    const { data } = await supabase
      .from("competitions")
      .select("*")
      .eq("user_id", authSession.user.id)
      .order("date", { ascending: false });

    if (data) setComps(data as Competition[]);
    setLoading(false);
  }, [authSession?.user]);

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

  const handleMarkResult = (comp: Competition) => {
    showResultDialog(comp, async (result, won, lost, notes) => {
      setComps((prev) =>
        prev.map((c) =>
          c.id === comp.id
            ? { ...c, completed: true, result, matches_won: won, matches_lost: lost, notes: notes || c.notes }
            : c
        )
      );

      await supabase
        .from("competitions")
        .update({
          completed: true,
          result,
          matches_won: won,
          matches_lost: lost,
        })
        .eq("id", comp.id);
    });
  };

  // Split into upcoming and past
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const upcoming = comps
    .filter((c) => !c.completed && c.date >= todayStr)
    .sort((a, b) => (a.date > b.date ? 1 : -1));
  const past = comps.filter((c) => c.completed || c.date < todayStr);

  type SectionData = { title: string; data: Competition[] };
  const sections: SectionData[] = [];
  if (upcoming.length > 0) sections.push({ title: "Upcoming", data: upcoming });
  if (past.length > 0) sections.push({ title: "Past Competitions", data: past });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
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
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Competitions</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("AddCompetition")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="add-circle" size={26} color={colors.accent} />
              </TouchableOpacity>
            </View>

            {/* Stats */}
            {comps.length > 0 && <StatsSummary comps={comps} />}
          </>
        }
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionLabel}>{title.toUpperCase()}</Text>
        )}
        renderItem={({ item, section }) => {
          if (section.title === "Upcoming") {
            return <UpcomingCard comp={item} />;
          }
          return (
            <PastCard comp={item} onMarkResult={() => handleMarkResult(item)} />
          );
        }}
        ListEmptyComponent={<EmptyState />}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AddCompetition")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={colors.textPrimary} />
      </TouchableOpacity>
    </View>
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
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 56,
    paddingBottom: 16,
  },
  headerTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 20,
    color: colors.textPrimary,
  },

  // Section
  sectionLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
