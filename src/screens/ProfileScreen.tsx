import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Polygon, Line, Circle, Text as SvgText } from "react-native-svg";
import { supabase } from "../lib/supabase";
import { useSession } from "../hooks/useSession";
import type { Profile, Belt, Session } from "../types";
import type { ProfileStackParamList } from "../navigation";

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

function getInitials(name: string | null, email: string | undefined): string {
  if (name) {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return (email?.[0] || "?").toUpperCase();
}

function beltLabel(belt: Belt): string {
  return belt.charAt(0).toUpperCase() + belt.slice(1) + " Belt";
}

function calculateStreak(sessions: { date: string }[]): number {
  if (sessions.length === 0) return 0;

  const uniqueDates = [
    ...new Set(sessions.map((s) => s.date)),
  ].sort((a, b) => (a > b ? -1 : 1));

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, "0")}-${String(yesterdayDate.getDate()).padStart(2, "0")}`;

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

// --- Radar Chart ---

const CHART_SIZE = 260;
const CENTER = CHART_SIZE / 2;
const RADIUS = 100;
const DNA_LABELS = ["Guard", "Passing", "Subs", "Takedowns", "Escapes"];
const ANGLES = DNA_LABELS.map(
  (_, i) => (Math.PI * 2 * i) / DNA_LABELS.length - Math.PI / 2
);

function polarToXY(angle: number, radius: number): { x: number; y: number } {
  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER + radius * Math.sin(angle),
  };
}

function gridPoints(radius: number): string {
  return ANGLES.map((a) => {
    const p = polarToXY(a, radius);
    return `${p.x},${p.y}`;
  }).join(" ");
}

function DnaRadarChart({ values }: { values: number[] }) {
  // values are 0-100, map to 0-RADIUS
  const dataPoints = values.map((v, i) => {
    const scaled = (Math.min(v, 100) / 100) * RADIUS;
    return polarToXY(ANGLES[i], scaled);
  });
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <View style={radarStyles.container}>
      <Svg width={CHART_SIZE} height={CHART_SIZE}>
        {/* Grid rings */}
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <Polygon
            key={scale}
            points={gridPoints(RADIUS * scale)}
            fill="none"
            stroke={colors.border}
            strokeWidth={1}
          />
        ))}

        {/* Axis lines */}
        {ANGLES.map((angle, i) => {
          const end = polarToXY(angle, RADIUS);
          return (
            <Line
              key={i}
              x1={CENTER}
              y1={CENTER}
              x2={end.x}
              y2={end.y}
              stroke={colors.border}
              strokeWidth={1}
            />
          );
        })}

        {/* Data polygon */}
        <Polygon
          points={dataPolygon}
          fill={colors.accent + "30"}
          stroke={colors.accent}
          strokeWidth={2}
        />

        {/* Data dots */}
        {dataPoints.map((p, i) => (
          <Circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill={colors.accent}
          />
        ))}

        {/* Labels */}
        {ANGLES.map((angle, i) => {
          const labelPos = polarToXY(angle, RADIUS + 24);
          return (
            <SvgText
              key={i}
              x={labelPos.x}
              y={labelPos.y + 4}
              textAnchor="middle"
              fill={colors.textSecondary}
              fontSize={11}
              fontFamily="DMSans_500Medium"
            >
              {DNA_LABELS[i]}
            </SvgText>
          );
        })}

        {/* Value labels */}
        {dataPoints.map((p, i) => (
          <SvgText
            key={`v${i}`}
            x={p.x}
            y={p.y - 10}
            textAnchor="middle"
            fill={colors.textPrimary}
            fontSize={10}
            fontFamily="DMSans_700Bold"
          >
            {values[i]}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

const radarStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 8,
  },
});

// --- Stat Card ---

function StatCard({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={statStyles.card}>
      <Ionicons
        name={icon}
        size={18}
        color={colors.textMuted}
        style={statStyles.icon}
      />
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    marginBottom: 6,
  },
  value: {
    fontFamily: "DMSans_700Bold",
    fontSize: 22,
    color: colors.gold,
  },
  label: {
    fontFamily: "DMSans_400Regular",
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
});

// --- Detail Stat Row ---

function DetailStatRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={detailStyles.row}>
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={detailStyles.value}>{value}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textSecondary,
  },
  value: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: colors.textPrimary,
  },
});

// --- Main Screen ---

type ProfileNav = NativeStackNavigationProp<ProfileStackParamList, "ProfileHome">;

interface SessionStats {
  totalSessions: number;
  totalMinutes: number;
  streak: number;
  tapsGiven: number;
  tapsReceived: number;
  rollingCount: number;
  drillingCount: number;
  compCount: number;
  thisMonthSessions: number;
  avgDuration: number;
}

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileNav>();
  const { session: authSession } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [gymName, setGymName] = useState<string | null>(null);
  const [stats, setStats] = useState<SessionStats>({
    totalSessions: 0,
    totalMinutes: 0,
    streak: 0,
    tapsGiven: 0,
    tapsReceived: 0,
    rollingCount: 0,
    drillingCount: 0,
    compCount: 0,
    thisMonthSessions: 0,
    avgDuration: 0,
  });
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
        .eq("user_id", userId),
    ]);

    if (profileRes.data) {
      const p = profileRes.data as Profile;
      setProfile(p);

      if (p.gym_id) {
        const { data: gym } = await supabase
          .from("gyms")
          .select("name")
          .eq("id", p.gym_id)
          .single();
        setGymName(gym?.name ?? null);
      } else {
        setGymName(null);
      }
    }

    if (sessionsRes.data) {
      const sessions = sessionsRes.data as Session[];
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

      const totalMins = sessions.reduce(
        (sum, s) => sum + (s.duration_minutes || 0),
        0
      );

      setStats({
        totalSessions: sessions.length,
        totalMinutes: totalMins,
        streak: calculateStreak(sessions),
        tapsGiven: sessions.reduce((sum, s) => sum + s.taps_given, 0),
        tapsReceived: sessions.reduce((sum, s) => sum + s.taps_received, 0),
        rollingCount: sessions.filter((s) => s.session_type === "rolling").length,
        drillingCount: sessions.filter((s) => s.session_type === "drilling").length,
        compCount: sessions.filter((s) => s.session_type === "competition").length,
        thisMonthSessions: sessions.filter((s) => s.date >= monthStart).length,
        avgDuration:
          sessions.length > 0 ? Math.round(totalMins / sessions.length) : 0,
      });
    }

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

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => supabase.auth.signOut(),
      },
    ]);
  };

  const email = authSession?.user?.email || "";
  const displayName = profile?.name || email.split("@")[0] || "Grappler";
  const belt = (profile?.belt as Belt) || "white";
  const beltColor = beltColors[belt] || beltColors.white;
  const stripes = Math.min(profile?.stripes || 0, 4);

  const totalHours = Math.round(stats.totalMinutes / 60);
  const hoursDisplay =
    stats.totalMinutes < 60
      ? `${stats.totalMinutes}m`
      : `${totalHours}h`;

  const subRate =
    stats.tapsGiven + stats.tapsReceived > 0
      ? Math.round(
          (stats.tapsGiven / (stats.tapsGiven + stats.tapsReceived)) * 100
        )
      : 0;

  const dnaValues = [
    profile?.dna_guard ?? 0,
    profile?.dna_passing ?? 0,
    profile?.dna_submissions ?? 0,
    profile?.dna_takedowns ?? 0,
    profile?.dna_escapes ?? 0,
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
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("EditProfile")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="create-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Avatar + Name + Belt */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { borderColor: beltColor }]}>
            <Text style={styles.avatarText}>
              {getInitials(profile?.name ?? null, email)}
            </Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>

          {/* Belt badge with visual stripes */}
          <View style={styles.beltRow}>
            <View style={[styles.beltDot, { backgroundColor: beltColor }]} />
            <Text style={styles.beltText}>{beltLabel(belt)}</Text>
            {stripes > 0 && (
              <View style={styles.stripesRow}>
                {Array.from({ length: stripes }).map((_, i) => (
                  <View
                    key={i}
                    style={[styles.stripeTick, { backgroundColor: beltColor }]}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Badges row */}
          <View style={styles.badgesRow}>
            {gymName && (
              <View style={styles.badge}>
                <Ionicons name="home-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.badgeText}>{gymName}</Text>
              </View>
            )}
            {profile?.weight_class && (
              <View style={styles.badge}>
                <Ionicons name="scale-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.badgeText}>{profile.weight_class}</Text>
              </View>
            )}
            {profile?.gi && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Gi</Text>
              </View>
            )}
            {profile?.nogi && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>No-Gi</Text>
              </View>
            )}
          </View>

          {/* Bio */}
          {profile?.bio && (
            <Text style={styles.bio}>{profile.bio}</Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard
            value={String(stats.totalSessions)}
            label="Sessions"
            icon="barbell-outline"
          />
          <StatCard value={hoursDisplay} label="Mat Time" icon="time-outline" />
          <StatCard
            value={String(stats.streak)}
            label="Day Streak"
            icon="flame-outline"
          />
        </View>

        {/* Game DNA Radar */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>GAME DNA</Text>
          <View style={styles.card}>
            <DnaRadarChart values={dnaValues} />
          </View>
        </View>

        {/* Training Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TRAINING BREAKDOWN</Text>
          <View style={styles.card}>
            <DetailStatRow
              label="This Month"
              value={`${stats.thisMonthSessions} sessions`}
            />
            <DetailStatRow
              label="Rolling"
              value={String(stats.rollingCount)}
            />
            <DetailStatRow
              label="Drilling"
              value={String(stats.drillingCount)}
            />
            <DetailStatRow
              label="Competition"
              value={String(stats.compCount)}
            />
            <DetailStatRow
              label="Avg Duration"
              value={`${stats.avgDuration} min`}
            />
            <DetailStatRow
              label="Submission Rate"
              value={`${subRate}%`}
            />
            <View style={detailStyles.row}>
              <Text style={detailStyles.label}>Taps Given / Received</Text>
              <Text style={detailStyles.value}>
                {stats.tapsGiven} / {stats.tapsReceived}
              </Text>
            </View>
          </View>
        </View>

        {/* Training Goals */}
        {profile?.training_goals && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TRAINING GOALS</Text>
            <View style={styles.card}>
              <View style={styles.goalsContent}>
                <Text style={styles.goalsText}>{profile.training_goals}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Edit Profile */}
        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={() => navigation.navigate("EditProfile")}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={18} color={colors.textPrimary} />
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.accent} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Header
  header: {
    paddingTop: 60,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 26,
    color: colors.textPrimary,
  },

  // Avatar
  avatarSection: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 24,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    marginBottom: 14,
  },
  avatarText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 30,
    color: colors.textPrimary,
  },
  name: {
    fontFamily: "DMSans_700Bold",
    fontSize: 24,
    color: colors.textPrimary,
  },
  beltRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  beltDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  beltText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: colors.textSecondary,
  },
  stripesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginLeft: 4,
  },
  stripeTick: {
    width: 4,
    height: 14,
    borderRadius: 1,
  },

  // Badges
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Bio
  bio: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 14,
    paddingHorizontal: 20,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Goals
  goalsContent: {
    paddingVertical: 16,
  },
  goalsText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Edit Profile
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  editProfileText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 16,
    color: colors.textPrimary,
  },

  // Sign out
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  signOutText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 16,
    color: colors.accent,
  },
});
