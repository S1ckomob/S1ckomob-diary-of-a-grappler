import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useSession } from "../hooks/useSession";
import type { Competition } from "../types";
import type { CompeteStackParamList } from "../navigation";

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

type CompNav = NativeStackNavigationProp<CompeteStackParamList, "CompeteHome">;

// ===== Stats Summary =====

function StatsSummary({ comps }: { comps: Competition[] }) {
  const completed = comps.filter((c) => c.completed);
  const medals = completed.filter(
    (c) => c.result === "gold" || c.result === "silver" || c.result === "bronze"
  ).length;
  const golds = completed.filter((c) => c.result === "gold").length;
  const totalWon = completed.reduce((s, c) => s + c.matches_won, 0);
  const totalLost = completed.reduce((s, c) => s + c.matches_lost, 0);
  const totalMatches = totalWon + totalLost;
  const winRate =
    totalMatches > 0 ? Math.round((totalWon / totalMatches) * 100) : 0;

  return (
    <View style={statsStyles.row}>
      <View style={statsStyles.card}>
        <Ionicons name="trophy" size={18} color={colors.gold} />
        <Text style={statsStyles.value}>{completed.length}</Text>
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

// ===== 12-Month Competition Calendar =====

function CompCalendar({ comps }: { comps: Competition[] }) {
  const now = new Date();
  const months: {
    year: number;
    month: number;
    label: string;
    shortYear: string;
  }[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleDateString("en-US", { month: "short" }),
      shortYear: "'" + d.getFullYear().toString().slice(2),
    });
  }

  const monthData = months.map((m) => {
    const count = comps.filter((c) => {
      const cd = new Date(c.date + "T00:00:00");
      return cd.getFullYear() === m.year && cd.getMonth() === m.month;
    }).length;
    const medalCount = comps.filter((c) => {
      const cd = new Date(c.date + "T00:00:00");
      return (
        cd.getFullYear() === m.year &&
        cd.getMonth() === m.month &&
        c.result &&
        c.result !== "dnp"
      );
    }).length;
    return { ...m, count, medalCount };
  });

  const isCurrMonth = (m: (typeof monthData)[0]) =>
    m.year === now.getFullYear() && m.month === now.getMonth();

  return (
    <View style={calStyles.container}>
      <Text style={calStyles.title}>COMPETITION CALENDAR</Text>
      <View style={calStyles.grid}>
        {monthData.map((m, i) => (
          <View key={i} style={calStyles.cell}>
            <View
              style={[
                calStyles.dot,
                m.count > 0 && calStyles.dotActive,
                m.count >= 2 && calStyles.dotHot,
                m.medalCount > 0 && calStyles.dotMedal,
                isCurrMonth(m) && m.count === 0 && calStyles.dotCurrent,
              ]}
            >
              {m.count > 0 ? (
                <Text
                  style={[
                    calStyles.dotCount,
                    m.medalCount > 0 && calStyles.dotCountMedal,
                  ]}
                >
                  {m.count}
                </Text>
              ) : null}
            </View>
            <Text
              style={[
                calStyles.monthLabel,
                isCurrMonth(m) && calStyles.monthLabelCurrent,
              ]}
            >
              {m.label}
            </Text>
            {(m.month === 0 || i === 0) && (
              <Text style={calStyles.yearLabel}>{m.shortYear}</Text>
            )}
          </View>
        ))}
      </View>
      <View style={calStyles.legend}>
        <View style={calStyles.legendItem}>
          <View style={[calStyles.legendDot, { backgroundColor: colors.accent }]} />
          <Text style={calStyles.legendText}>Competed</Text>
        </View>
        <View style={calStyles.legendItem}>
          <View style={[calStyles.legendDot, { backgroundColor: colors.gold }]} />
          <Text style={calStyles.legendText}>Won medal</Text>
        </View>
      </View>
    </View>
  );
}

const calStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  title: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cell: {
    width: "16.66%",
    alignItems: "center",
    marginBottom: 14,
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  dotActive: {
    backgroundColor: colors.accent + "30",
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  dotHot: {
    backgroundColor: colors.accent + "50",
  },
  dotMedal: {
    backgroundColor: colors.gold + "25",
    borderColor: colors.gold,
  },
  dotCurrent: {
    borderWidth: 1,
    borderColor: colors.textMuted,
    borderStyle: "dashed",
  },
  dotCount: {
    fontFamily: "DMSans_700Bold",
    fontSize: 13,
    color: colors.accent,
  },
  dotCountMedal: {
    color: colors.gold,
  },
  monthLabel: {
    fontFamily: "DMSans_400Regular",
    fontSize: 10,
    color: colors.textMuted,
  },
  monthLabelCurrent: {
    color: colors.textPrimary,
    fontFamily: "DMSans_700Bold",
  },
  yearLabel: {
    fontFamily: "DMSans_400Regular",
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 1,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 10,
    color: colors.textMuted,
  },
});

// ===== Year-over-Year Comparison =====

function YearComparison({ comps }: { comps: Competition[] }) {
  const now = new Date();
  const thisYear = now.getFullYear();
  const lastYear = thisYear - 1;

  const thisYearComps = comps.filter(
    (c) => new Date(c.date + "T00:00:00").getFullYear() === thisYear
  );
  const lastYearComps = comps.filter(
    (c) => new Date(c.date + "T00:00:00").getFullYear() === lastYear
  );

  if (lastYearComps.length === 0) return null;

  const calcStats = (list: Competition[]) => {
    const completed = list.filter((c) => c.completed);
    const medals = completed.filter(
      (c) => c.result && c.result !== "dnp"
    ).length;
    const totalWon = completed.reduce((s, c) => s + c.matches_won, 0);
    const totalLost = completed.reduce((s, c) => s + c.matches_lost, 0);
    const totalMatches = totalWon + totalLost;
    const winRate =
      totalMatches > 0 ? Math.round((totalWon / totalMatches) * 100) : 0;
    return { total: list.length, medals, winRate };
  };

  const curr = calcStats(thisYearComps);
  const prev = calcStats(lastYearComps);

  const rows = [
    { label: "Competitions", c: curr.total, p: prev.total, pct: false },
    { label: "Medals", c: curr.medals, p: prev.medals, pct: false },
    { label: "Win Rate", c: curr.winRate, p: prev.winRate, pct: true },
  ];

  return (
    <View style={yoyStyles.container}>
      <Text style={yoyStyles.title}>YEAR OVER YEAR</Text>
      <View style={yoyStyles.headerRow}>
        <Text style={[yoyStyles.cell, yoyStyles.labelCell]} />
        <Text style={[yoyStyles.cell, yoyStyles.headerYear]}>{thisYear}</Text>
        <Text style={[yoyStyles.cell, yoyStyles.headerYear]}>{lastYear}</Text>
        <Text style={[yoyStyles.cell, yoyStyles.headerYear]}>+/-</Text>
      </View>
      {rows.map((r) => {
        const diff = r.c - r.p;
        const diffColor =
          diff > 0
            ? colors.green
            : diff < 0
              ? colors.accent
              : colors.textMuted;
        return (
          <View key={r.label} style={yoyStyles.dataRow}>
            <Text style={[yoyStyles.cell, yoyStyles.rowLabel]}>{r.label}</Text>
            <Text style={[yoyStyles.cell, yoyStyles.rowValue]}>
              {r.c}
              {r.pct ? "%" : ""}
            </Text>
            <Text style={[yoyStyles.cell, yoyStyles.rowValueMuted]}>
              {r.p}
              {r.pct ? "%" : ""}
            </Text>
            <Text style={[yoyStyles.cell, yoyStyles.rowDiff, { color: diffColor }]}>
              {diff > 0 ? "+" : ""}
              {diff}
              {r.pct ? "%" : ""}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const yoyStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  title: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: "row",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 6,
  },
  cell: {
    flex: 1,
    textAlign: "center",
  },
  labelCell: {
    flex: 1.5,
    textAlign: "left",
  },
  headerYear: {
    fontFamily: "DMSans_700Bold",
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },
  dataRow: {
    flexDirection: "row",
    paddingVertical: 8,
  },
  rowLabel: {
    flex: 1.5,
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "left",
  },
  rowValue: {
    fontFamily: "DMSans_700Bold",
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: "center",
  },
  rowValueMuted: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
  },
  rowDiff: {
    fontFamily: "DMSans_700Bold",
    fontSize: 14,
    textAlign: "center",
  },
});

// ===== Upcoming Card =====

function UpcomingCard({
  comp,
  onEdit,
}: {
  comp: Competition;
  onEdit: () => void;
}) {
  const days = daysUntil(comp.date);

  return (
    <TouchableOpacity
      style={upcomingStyles.container}
      onPress={onEdit}
      activeOpacity={0.7}
    >
      <View style={upcomingStyles.dateCol}>
        <Text style={upcomingStyles.daysNum}>{days <= 0 ? "!" : days}</Text>
        <Text style={upcomingStyles.daysLabel}>
          {days <= 0 ? "Today" : days === 1 ? "day" : "days"}
        </Text>
      </View>
      <View style={upcomingStyles.info}>
        <Text style={upcomingStyles.name}>{comp.name}</Text>
        <View style={upcomingStyles.metaRow}>
          <Ionicons
            name="calendar-outline"
            size={12}
            color={colors.textMuted}
          />
          <Text style={upcomingStyles.meta}>{formatDate(comp.date)}</Text>
        </View>
        {comp.location && (
          <View style={upcomingStyles.metaRow}>
            <Ionicons
              name="location-outline"
              size={12}
              color={colors.textMuted}
            />
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
            <Text style={upcomingStyles.tagText}>
              {comp.gi ? "Gi" : "No-Gi"}
            </Text>
          </View>
          {comp.weight_class && (
            <View style={upcomingStyles.tag}>
              <Text style={upcomingStyles.tagText}>{comp.weight_class}</Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={colors.textMuted}
        style={upcomingStyles.chevron}
      />
    </TouchableOpacity>
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
    alignItems: "center",
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
  chevron: {
    marginLeft: 4,
  },
});

// ===== Past Card =====

function PastCard({
  comp,
  onEdit,
}: {
  comp: Competition;
  onEdit: () => void;
}) {
  const rc = comp.result ? resultColors[comp.result] : colors.textMuted;
  const rl = comp.result ? resultLabels[comp.result] : "No result";
  const re = comp.result ? resultEmojis[comp.result] : "";
  const totalMatches = comp.matches_won + comp.matches_lost;

  return (
    <TouchableOpacity
      style={pastStyles.container}
      onPress={onEdit}
      activeOpacity={0.7}
    >
      <View style={pastStyles.topRow}>
        <View style={pastStyles.info}>
          <Text style={pastStyles.name}>{comp.name}</Text>
          <Text style={pastStyles.date}>{formatDate(comp.date)}</Text>
          {comp.location && (
            <Text style={pastStyles.location}>{comp.location}</Text>
          )}
        </View>
        {comp.result ? (
          <View
            style={[pastStyles.resultBadge, { backgroundColor: rc + "20" }]}
          >
            {re ? <Text style={pastStyles.resultEmoji}>{re}</Text> : null}
            <Text style={[pastStyles.resultText, { color: rc }]}>{rl}</Text>
          </View>
        ) : (
          <View style={pastStyles.addResultBtn}>
            <Text style={pastStyles.addResultText}>Add Result</Text>
          </View>
        )}
      </View>

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
            <Text style={pastStyles.tagText}>
              {comp.gi ? "Gi" : "No-Gi"}
            </Text>
          </View>
        </View>
      </View>

      {comp.notes && <Text style={pastStyles.notes}>{comp.notes}</Text>}
    </TouchableOpacity>
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

// ===== Empty State =====

function EmptyState() {
  return (
    <View style={emptyStyles.container}>
      <Text style={emptyStyles.icon}>{"\u{1F3C6}"}</Text>
      <Text style={emptyStyles.title}>No competitions yet</Text>
      <Text style={emptyStyles.subtitle}>
        Add your first competition to start{"\n"}tracking your tournament
        journey.
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

// ===== Main Screen =====

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

  // Split into upcoming and past
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const upcoming = comps
    .filter((c) => !c.completed && c.date >= todayStr)
    .sort((a, b) => (a.date > b.date ? 1 : -1));
  const past = comps.filter((c) => c.completed || c.date < todayStr);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Compete</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("AddCompetition")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="add-circle" size={28} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {comps.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <StatsSummary comps={comps} />

            <CompCalendar comps={comps} />

            <YearComparison comps={comps} />

            {/* Upcoming */}
            {upcoming.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>UPCOMING</Text>
                {upcoming.map((c) => (
                  <UpcomingCard
                    key={c.id}
                    comp={c}
                    onEdit={() =>
                      navigation.navigate("EditCompetition", {
                        competition: c,
                      })
                    }
                  />
                ))}
              </>
            )}

            {/* Past */}
            {past.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>PAST COMPETITIONS</Text>
                {past.map((c) => (
                  <PastCard
                    key={c.id}
                    comp={c}
                    onEdit={() =>
                      navigation.navigate("EditCompetition", {
                        competition: c,
                      })
                    }
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

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

// --- Main Styles ---

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
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 26,
    color: colors.textPrimary,
  },
  sectionLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
  },
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
