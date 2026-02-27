import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Svg, {
  Rect,
  Line,
  Circle,
  Polyline,
  Text as SvgText,
  G,
  Path,
} from "react-native-svg";
import { supabase } from "../lib/supabase";
import { useSession } from "../hooks/useSession";
import type { Profile, Session, Belt } from "../types";

// --- Theme ---

const colors = {
  background: "#08080D",
  surface: "#11111A",
  surfaceRaised: "#1A1A26",
  accent: "#C41E3A",
  accentLight: "#C41E3A40",
  gold: "#C9A84C",
  green: "#2D8E4E",
  blue: "#1A5CCF",
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

// Rough milestones: sessions typically needed per belt
const BELT_SESSIONS: Record<Belt, { next: Belt | null; target: number }> = {
  white: { next: "blue", target: 200 },
  blue: { next: "purple", target: 400 },
  purple: { next: "brown", target: 500 },
  brown: { next: "black", target: 400 },
  black: { next: null, target: 0 },
};

// --- Helpers ---

function getWeekLabel(weeksAgo: number): string {
  if (weeksAgo === 0) return "This wk";
  if (weeksAgo === 1) return "Last wk";
  const d = new Date();
  d.setDate(d.getDate() - weeksAgo * 7);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getMonthLabel(monthsAgo: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  return d.toLocaleString("en-US", { month: "short" });
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function calculateStreak(dates: string[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 };

  const unique = [...new Set(dates)].sort((a, b) => (a > b ? -1 : 1));
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

  // Current streak
  let current = 0;
  if (unique[0] === todayStr || unique[0] === yesterdayStr) {
    current = 1;
    for (let i = 1; i < unique.length; i++) {
      const curr = new Date(unique[i - 1] + "T00:00:00");
      const prev = new Date(unique[i] + "T00:00:00");
      const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
      if (diff === 1) current++;
      else break;
    }
  }

  // Longest streak
  const asc = [...unique].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < asc.length; i++) {
    const curr = new Date(asc[i] + "T00:00:00");
    const prev = new Date(asc[i - 1] + "T00:00:00");
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  return { current, longest };
}

function dnaColor(value: number): string {
  if (value >= 70) return colors.green;
  if (value >= 40) return colors.gold;
  return colors.accent;
}

// ============================================================
// CHART COMPONENTS (built with react-native-svg)
// ============================================================

// --- Bar Chart: Sessions per Week ---

const BAR_CHART_W = 320;
const BAR_CHART_H = 160;
const BAR_PAD_L = 28;
const BAR_PAD_R = 8;
const BAR_PAD_T = 12;
const BAR_PAD_B = 28;

function SessionsBarChart({ data }: { data: { label: string; value: number }[] }) {
  const plotW = BAR_CHART_W - BAR_PAD_L - BAR_PAD_R;
  const plotH = BAR_CHART_H - BAR_PAD_T - BAR_PAD_B;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barW = plotW / data.length - 6;

  return (
    <Svg width={BAR_CHART_W} height={BAR_CHART_H}>
      {/* Grid lines */}
      {[0, 0.5, 1].map((frac) => (
        <Line
          key={frac}
          x1={BAR_PAD_L}
          y1={BAR_PAD_T + plotH * (1 - frac)}
          x2={BAR_CHART_W - BAR_PAD_R}
          y2={BAR_PAD_T + plotH * (1 - frac)}
          stroke={colors.border}
          strokeWidth={1}
        />
      ))}
      {/* Y-axis labels */}
      <SvgText x={2} y={BAR_PAD_T + 4} fill={colors.textMuted} fontSize={9}>
        {maxVal}
      </SvgText>
      <SvgText x={2} y={BAR_PAD_T + plotH / 2 + 4} fill={colors.textMuted} fontSize={9}>
        {Math.round(maxVal / 2)}
      </SvgText>
      <SvgText x={2} y={BAR_PAD_T + plotH + 4} fill={colors.textMuted} fontSize={9}>
        0
      </SvgText>
      {/* Bars */}
      {data.map((d, i) => {
        const x = BAR_PAD_L + (plotW / data.length) * i + 3;
        const h = maxVal > 0 ? (d.value / maxVal) * plotH : 0;
        const y = BAR_PAD_T + plotH - h;
        return (
          <G key={i}>
            <Rect
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={3}
              fill={colors.accent}
            />
            {/* X label */}
            <SvgText
              x={x + barW / 2}
              y={BAR_CHART_H - 4}
              textAnchor="middle"
              fill={colors.textMuted}
              fontSize={8}
            >
              {d.label}
            </SvgText>
            {/* Value on top */}
            {d.value > 0 && (
              <SvgText
                x={x + barW / 2}
                y={y - 4}
                textAnchor="middle"
                fill={colors.textPrimary}
                fontSize={9}
                fontWeight="bold"
              >
                {d.value}
              </SvgText>
            )}
          </G>
        );
      })}
    </Svg>
  );
}

// --- Line Chart: Mat Time per Month ---

const LINE_CHART_W = 320;
const LINE_CHART_H = 160;
const LINE_PAD_L = 32;
const LINE_PAD_R = 12;
const LINE_PAD_T = 16;
const LINE_PAD_B = 28;

function MatTimeLineChart({ data }: { data: { label: string; value: number }[] }) {
  const plotW = LINE_CHART_W - LINE_PAD_L - LINE_PAD_R;
  const plotH = LINE_CHART_H - LINE_PAD_T - LINE_PAD_B;
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  const points = data.map((d, i) => {
    const x = LINE_PAD_L + (plotW / Math.max(data.length - 1, 1)) * i;
    const y = LINE_PAD_T + plotH - (d.value / maxVal) * plotH;
    return { x, y, value: d.value };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Area fill path
  const areaPath =
    `M ${points[0].x},${LINE_PAD_T + plotH} ` +
    points.map((p) => `L ${p.x},${p.y}`).join(" ") +
    ` L ${points[points.length - 1].x},${LINE_PAD_T + plotH} Z`;

  return (
    <Svg width={LINE_CHART_W} height={LINE_CHART_H}>
      {/* Grid lines */}
      {[0, 0.5, 1].map((frac) => (
        <Line
          key={frac}
          x1={LINE_PAD_L}
          y1={LINE_PAD_T + plotH * (1 - frac)}
          x2={LINE_CHART_W - LINE_PAD_R}
          y2={LINE_PAD_T + plotH * (1 - frac)}
          stroke={colors.border}
          strokeWidth={1}
        />
      ))}
      {/* Y labels */}
      <SvgText x={2} y={LINE_PAD_T + 4} fill={colors.textMuted} fontSize={9}>
        {maxVal}h
      </SvgText>
      <SvgText x={2} y={LINE_PAD_T + plotH + 4} fill={colors.textMuted} fontSize={9}>
        0h
      </SvgText>
      {/* Area */}
      <Path d={areaPath} fill={colors.gold + "18"} />
      {/* Line */}
      <Polyline
        points={polyline}
        fill="none"
        stroke={colors.gold}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {/* Dots + labels */}
      {points.map((p, i) => (
        <G key={i}>
          <Circle cx={p.x} cy={p.y} r={4} fill={colors.gold} />
          <SvgText
            x={p.x}
            y={LINE_CHART_H - 4}
            textAnchor="middle"
            fill={colors.textMuted}
            fontSize={9}
          >
            {data[i].label}
          </SvgText>
          {p.value > 0 && (
            <SvgText
              x={p.x}
              y={p.y - 8}
              textAnchor="middle"
              fill={colors.textPrimary}
              fontSize={9}
              fontWeight="bold"
            >
              {p.value}
            </SvgText>
          )}
        </G>
      ))}
    </Svg>
  );
}

// --- Ring Chart: Submission Ratio ---

const RING_SIZE = 120;
const RING_CENTER = RING_SIZE / 2;
const RING_R = 46;
const RING_STROKE = 10;

function SubRing({ given, received }: { given: number; received: number }) {
  const total = given + received;
  const ratio = total > 0 ? given / total : 0;
  const circumference = 2 * Math.PI * RING_R;
  const givenArc = circumference * ratio;
  const receivedArc = circumference - givenArc;

  // SVG arc using stroke-dasharray
  const givenOffset = circumference * 0.25; // start at top

  return (
    <Svg width={RING_SIZE} height={RING_SIZE}>
      {/* Background ring */}
      <Circle
        cx={RING_CENTER}
        cy={RING_CENTER}
        r={RING_R}
        fill="none"
        stroke={colors.surfaceRaised}
        strokeWidth={RING_STROKE}
      />
      {/* Received arc (red) */}
      <Circle
        cx={RING_CENTER}
        cy={RING_CENTER}
        r={RING_R}
        fill="none"
        stroke={colors.accent + "50"}
        strokeWidth={RING_STROKE}
        strokeDasharray={`${circumference}`}
        strokeDashoffset={givenOffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${RING_CENTER} ${RING_CENTER})`}
      />
      {/* Given arc (green) */}
      <Circle
        cx={RING_CENTER}
        cy={RING_CENTER}
        r={RING_R}
        fill="none"
        stroke={colors.green}
        strokeWidth={RING_STROKE}
        strokeDasharray={`${givenArc} ${receivedArc}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform={`rotate(-90 ${RING_CENTER} ${RING_CENTER})`}
      />
      {/* Center text */}
      <SvgText
        x={RING_CENTER}
        y={RING_CENTER - 2}
        textAnchor="middle"
        fill={colors.textPrimary}
        fontSize={20}
        fontWeight="bold"
      >
        {total > 0 ? `${Math.round(ratio * 100)}%` : "—"}
      </SvgText>
      <SvgText
        x={RING_CENTER}
        y={RING_CENTER + 14}
        textAnchor="middle"
        fill={colors.textMuted}
        fontSize={9}
      >
        sub rate
      </SvgText>
    </Svg>
  );
}

// ============================================================
// SECTION COMPONENTS
// ============================================================

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionLabel}>{title}</Text>;
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

// --- Streak Card ---

function StreakSection({
  current,
  longest,
  total,
}: {
  current: number;
  longest: number;
  total: number;
}) {
  return (
    <View style={styles.streakRow}>
      <View style={styles.streakCard}>
        <Ionicons name="flame" size={22} color={colors.accent} />
        <Text style={styles.streakValue}>{current}</Text>
        <Text style={styles.streakLabel}>Current{"\n"}Streak</Text>
      </View>
      <View style={styles.streakCard}>
        <Ionicons name="trophy" size={22} color={colors.gold} />
        <Text style={styles.streakValue}>{longest}</Text>
        <Text style={styles.streakLabel}>Longest{"\n"}Streak</Text>
      </View>
      <View style={styles.streakCard}>
        <Ionicons name="barbell" size={22} color={colors.green} />
        <Text style={styles.streakValue}>{total}</Text>
        <Text style={styles.streakLabel}>Total{"\n"}Sessions</Text>
      </View>
    </View>
  );
}

// --- DNA Progress ---

function DnaProgressRow({
  label,
  current,
  initial,
}: {
  label: string;
  current: number;
  initial: number;
}) {
  const diff = current - initial;
  const diffColor = diff > 0 ? colors.green : diff < 0 ? colors.accent : colors.textMuted;
  const diffLabel = diff > 0 ? `+${diff}` : diff < 0 ? String(diff) : "—";
  const barColor = dnaColor(current);

  return (
    <View style={dnaProgressStyles.row}>
      <Text style={dnaProgressStyles.label}>{label}</Text>
      <View style={dnaProgressStyles.barWrap}>
        <View style={dnaProgressStyles.track}>
          <View
            style={[
              dnaProgressStyles.fill,
              { width: `${Math.min(current, 100)}%`, backgroundColor: barColor },
            ]}
          />
        </View>
      </View>
      <Text style={[dnaProgressStyles.value, { color: barColor }]}>{current}</Text>
      <View style={[dnaProgressStyles.diffBadge, { backgroundColor: diffColor + "20" }]}>
        <Text style={[dnaProgressStyles.diffText, { color: diffColor }]}>
          {diffLabel}
        </Text>
      </View>
    </View>
  );
}

const dnaProgressStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: colors.textSecondary,
    width: 80,
  },
  barWrap: {
    flex: 1,
    marginHorizontal: 10,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceRaised,
    overflow: "hidden",
  },
  fill: {
    height: 6,
    borderRadius: 3,
  },
  value: {
    fontFamily: "DMSans_700Bold",
    fontSize: 13,
    width: 28,
    textAlign: "right",
  },
  diffBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 34,
    alignItems: "center",
  },
  diffText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 11,
  },
});

// --- Belt Journey ---

function BeltJourney({
  belt,
  stripes,
  totalSessions,
}: {
  belt: Belt;
  stripes: number;
  totalSessions: number;
}) {
  const info = BELT_SESSIONS[belt];
  const beltColor = beltColors[belt];

  if (!info.next) {
    return (
      <View style={beltStyles.container}>
        <View style={beltStyles.header}>
          <View style={[beltStyles.dot, { backgroundColor: beltColor }]} />
          <Text style={beltStyles.title}>Black Belt</Text>
        </View>
        <Text style={beltStyles.subtitle}>
          You've reached the summit. {totalSessions} sessions and counting.
        </Text>
      </View>
    );
  }

  const nextColor = beltColors[info.next];
  const progress = Math.min(totalSessions / info.target, 1);
  const remaining = Math.max(info.target - totalSessions, 0);

  return (
    <View style={beltStyles.container}>
      <View style={beltStyles.header}>
        <View style={[beltStyles.dot, { backgroundColor: beltColor }]} />
        <Text style={beltStyles.title}>
          {belt.charAt(0).toUpperCase() + belt.slice(1)} Belt
          {stripes > 0 && ` \u00B7 ${stripes} stripe${stripes !== 1 ? "s" : ""}`}
        </Text>
        <Ionicons name="arrow-forward" size={14} color={colors.textMuted} />
        <View style={[beltStyles.dot, { backgroundColor: nextColor }]} />
        <Text style={beltStyles.nextLabel}>
          {info.next.charAt(0).toUpperCase() + info.next.slice(1)}
        </Text>
      </View>

      <View style={beltStyles.progressTrack}>
        <View
          style={[
            beltStyles.progressFill,
            { width: `${progress * 100}%`, backgroundColor: nextColor },
          ]}
        />
      </View>

      <View style={beltStyles.statsRow}>
        <Text style={beltStyles.stat}>
          {totalSessions} / {info.target} sessions
        </Text>
        <Text style={beltStyles.stat}>
          {remaining > 0 ? `${remaining} to go` : "Ready!"}
        </Text>
      </View>

      <Text style={beltStyles.disclaimer}>
        Based on typical training milestones. Promotion is at your coach's discretion.
      </Text>
    </View>
  );
}

const beltStyles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  title: {
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: colors.textPrimary,
  },
  nextLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: colors.textSecondary,
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surfaceRaised,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: 10,
    borderRadius: 5,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  stat: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: colors.textMuted,
  },
  subtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  disclaimer: {
    fontFamily: "DMSans_400Regular",
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: "italic",
    lineHeight: 16,
  },
});

// ============================================================
// MAIN SCREEN
// ============================================================

export default function ProgressScreen() {
  const navigation = useNavigation();
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
        .order("date", { ascending: false }),
    ]);

    if (profileRes.data) setProfile(profileRes.data as Profile);
    if (sessionsRes.data) setSessions(sessionsRes.data as Session[]);
    setLoading(false);
  }, [authSession?.user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // --- Compute chart data ---

  // 1) Sessions per week (last 8 weeks)
  const weeklyData = (() => {
    const weeks: { label: string; value: number }[] = [];
    for (let w = 7; w >= 0; w--) {
      const start = new Date();
      start.setDate(start.getDate() - w * 7 - start.getDay());
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);

      const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
      const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;

      const count = sessions.filter(
        (s) => s.date >= startStr && s.date < endStr
      ).length;

      weeks.push({ label: getWeekLabel(w), value: count });
    }
    return weeks;
  })();

  // 2) Mat time per month (last 6 months)
  const monthlyData = (() => {
    const months: { label: string; value: number }[] = [];
    for (let m = 5; m >= 0; m--) {
      const d = new Date();
      d.setMonth(d.getMonth() - m);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const prefix = `${year}-${String(month).padStart(2, "0")}`;

      const totalMin = sessions
        .filter((s) => s.date.startsWith(prefix))
        .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

      months.push({
        label: getMonthLabel(m),
        value: Math.round(totalMin / 60),
      });
    }
    return months;
  })();

  // 3) Submission ratio
  const totalGiven = sessions.reduce((s, x) => s + x.taps_given, 0);
  const totalReceived = sessions.reduce((s, x) => s + x.taps_received, 0);

  // 4) Streaks
  const dates = sessions.map((s) => s.date);
  const { current: currentStreak, longest: longestStreak } = calculateStreak(dates);

  // 5) DNA values (current; initial approximated as 50 baseline from onboarding defaults)
  const dnaFields = [
    { label: "Guard", current: profile?.dna_guard ?? 0, initial: 50 },
    { label: "Passing", current: profile?.dna_passing ?? 0, initial: 50 },
    { label: "Submissions", current: profile?.dna_submissions ?? 0, initial: 50 },
    { label: "Takedowns", current: profile?.dna_takedowns ?? 0, initial: 50 },
    { label: "Escapes", current: profile?.dna_escapes ?? 0, initial: 50 },
  ];

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
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Progress</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Streak Tracker */}
        <SectionHeader title="STREAK TRACKER" />
        <StreakSection
          current={currentStreak}
          longest={longestStreak}
          total={sessions.length}
        />

        {/* Sessions per Week */}
        <SectionHeader title="SESSIONS PER WEEK" />
        <Card>
          <View style={styles.chartWrap}>
            <SessionsBarChart data={weeklyData} />
          </View>
        </Card>

        {/* Mat Time per Month */}
        <SectionHeader title="MAT TIME (HOURS / MONTH)" />
        <Card>
          <View style={styles.chartWrap}>
            <MatTimeLineChart data={monthlyData} />
          </View>
        </Card>

        {/* Submission Ratio */}
        <SectionHeader title="SUBMISSION RATIO" />
        <Card>
          <View style={styles.subRatioWrap}>
            <SubRing given={totalGiven} received={totalReceived} />
            <View style={styles.subRatioStats}>
              <View style={styles.subRatioRow}>
                <View style={[styles.subLegendDot, { backgroundColor: colors.green }]} />
                <Text style={styles.subRatioLabel}>Taps Given</Text>
                <Text style={styles.subRatioValue}>{totalGiven}</Text>
              </View>
              <View style={styles.subRatioRow}>
                <View style={[styles.subLegendDot, { backgroundColor: colors.accent + "80" }]} />
                <Text style={styles.subRatioLabel}>Taps Received</Text>
                <Text style={styles.subRatioValue}>{totalReceived}</Text>
              </View>
              <View style={[styles.subRatioRow, { borderBottomWidth: 0 }]}>
                <View style={{ width: 10 }} />
                <Text style={styles.subRatioLabel}>Total Exchanges</Text>
                <Text style={styles.subRatioValue}>
                  {totalGiven + totalReceived}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* DNA Progress */}
        <SectionHeader title="DNA PROGRESS" />
        <Card>
          <View style={styles.dnaWrap}>
            {dnaFields.map((d) => (
              <DnaProgressRow
                key={d.label}
                label={d.label}
                current={d.current}
                initial={d.initial}
              />
            ))}
            <Text style={styles.dnaDisclaimer}>
              Compared to default baseline (50). Update your DNA in Edit Profile.
            </Text>
          </View>
        </Card>

        {/* Belt Journey */}
        <SectionHeader title="BELT JOURNEY" />
        <Card>
          <BeltJourney
            belt={profile?.belt ?? "white"}
            stripes={profile?.stripes ?? 0}
            totalSessions={sessions.length}
          />
        </Card>
      </ScrollView>
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
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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

  // Sections
  sectionLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    overflow: "hidden",
  },

  // Charts
  chartWrap: {
    alignItems: "center",
    paddingVertical: 14,
  },

  // Streak
  streakRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  streakCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  streakValue: {
    fontFamily: "DMSans_700Bold",
    fontSize: 26,
    color: colors.textPrimary,
  },
  streakLabel: {
    fontFamily: "DMSans_400Regular",
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 15,
  },

  // Sub ratio
  subRatioWrap: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 16,
  },
  subRatioStats: {
    flex: 1,
  },
  subRatioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  subRatioLabel: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  subRatioValue: {
    fontFamily: "DMSans_700Bold",
    fontSize: 14,
    color: colors.textPrimary,
  },

  // DNA
  dnaWrap: {
    padding: 16,
    paddingBottom: 8,
  },
  dnaDisclaimer: {
    fontFamily: "DMSans_400Regular",
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: "italic",
    marginTop: 8,
    paddingTop: 8,
    lineHeight: 16,
  },
});
