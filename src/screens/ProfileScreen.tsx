import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import { useSession } from "../hooks/useSession";
import type { Profile, Belt } from "../types";
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

function dnaBarColor(value: number): string {
  if (value >= 70) return colors.green;
  if (value >= 40) return colors.gold;
  return colors.accent;
}

// --- Stat Card ---

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={statStyles.card}>
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
  value: {
    fontFamily: "DMSans_700Bold",
    fontSize: 22,
    color: colors.gold,
  },
  label: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
});

// --- DNA Bar ---

function DnaBar({ label, value }: { label: string; value: number }) {
  const barColor = dnaBarColor(value);
  return (
    <View style={dnaStyles.row}>
      <View style={dnaStyles.labelRow}>
        <Text style={dnaStyles.label}>{label}</Text>
        <Text style={[dnaStyles.value, { color: barColor }]}>{value}</Text>
      </View>
      <View style={dnaStyles.track}>
        <View
          style={[
            dnaStyles.fill,
            { width: `${Math.min(value, 100)}%`, backgroundColor: barColor },
          ]}
        />
      </View>
    </View>
  );
}

const dnaStyles = StyleSheet.create({
  row: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  label: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: colors.textSecondary,
  },
  value: {
    fontFamily: "DMSans_700Bold",
    fontSize: 14,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceRaised,
    overflow: "hidden",
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
});

// --- Main Screen ---

type ProfileNav = NativeStackNavigationProp<ProfileStackParamList, "ProfileHome">;

interface SessionStats {
  totalSessions: number;
  totalMinutes: number;
  streak: number;
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
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!authSession?.user) return;
    const userId = authSession.user.id;

    const [profileRes, sessionsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase
        .from("sessions")
        .select("duration_minutes, date")
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
      const sessions = sessionsRes.data;
      setStats({
        totalSessions: sessions.length,
        totalMinutes: sessions.reduce(
          (sum, s) => sum + (s.duration_minutes || 0),
          0
        ),
        streak: calculateStreak(sessions),
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
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
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

          {/* Gym name */}
          {gymName && <Text style={styles.gymName}>{gymName}</Text>}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard value={String(stats.totalSessions)} label="Sessions" />
          <StatCard value={hoursDisplay} label="Mat Time" />
          <StatCard
            value={String(stats.streak)}
            label={stats.streak === 1 ? "Day Streak" : "Day Streak"}
          />
        </View>

        {/* Your Game - DNA Bars */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Your Game</Text>
          <View style={styles.infoCard}>
            <View style={{ paddingVertical: 14 }}>
              <DnaBar label="Guard" value={profile?.dna_guard ?? 0} />
              <DnaBar label="Passing" value={profile?.dna_passing ?? 0} />
              <DnaBar label="Submissions" value={profile?.dna_submissions ?? 0} />
              <DnaBar label="Takedowns" value={profile?.dna_takedowns ?? 0} />
              <DnaBar label="Escapes" value={profile?.dna_escapes ?? 0} />
            </View>
          </View>
        </View>

        {/* Edit Profile */}
        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={() => navigation.navigate("EditProfile")}
          activeOpacity={0.8}
        >
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    marginBottom: 14,
  },
  avatarText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 28,
    color: colors.textPrimary,
  },
  name: {
    fontFamily: "DMSans_700Bold",
    fontSize: 22,
    color: colors.textPrimary,
  },
  beltRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
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
  gymName: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Edit Profile
  editProfileButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
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
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.accent,
  },
  signOutText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 16,
    color: colors.accent,
  },
});
