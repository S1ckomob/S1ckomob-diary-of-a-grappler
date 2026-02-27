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

function stripesLabel(stripes: number): string {
  if (stripes === 0) return "No stripes";
  if (stripes === 1) return "1 stripe";
  return `${stripes} stripes`;
}

function formatMemberSince(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// --- Stat Card ---

function StatCard({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
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

// --- Info Row ---

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
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
  totalSubs: number;
}

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileNav>();
  const { session: authSession } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<SessionStats>({
    totalSessions: 0,
    totalMinutes: 0,
    totalSubs: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!authSession?.user) return;
    const userId = authSession.user.id;

    const [profileRes, sessionsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase
        .from("sessions")
        .select("duration_minutes, taps_given")
        .eq("user_id", userId),
    ]);

    if (profileRes.data) setProfile(profileRes.data as Profile);

    if (sessionsRes.data) {
      const sessions = sessionsRes.data;
      setStats({
        totalSessions: sessions.length,
        totalMinutes: sessions.reduce(
          (sum, s) => sum + (s.duration_minutes || 0),
          0
        ),
        totalSubs: sessions.reduce((sum, s) => sum + (s.taps_given || 0), 0),
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

        {/* Avatar + Name */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { borderColor: beltColor }]}>
            <Text style={styles.avatarText}>
              {getInitials(profile?.name ?? null, email)}
            </Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>

          {/* Belt badge */}
          <View style={styles.beltRow}>
            <View style={[styles.beltDot, { backgroundColor: beltColor }]} />
            <Text style={styles.beltText}>
              {beltLabel(belt)}
              {profile?.stripes ? ` \u00B7 ${stripesLabel(profile.stripes)}` : ""}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard value={String(stats.totalSessions)} label="Sessions" />
          <StatCard value={hoursDisplay} label="Mat Time" />
          <StatCard value={String(stats.totalSubs)} label="Subs" />
        </View>

        {/* Profile Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Details</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("EditProfile")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoCard}>
            <InfoRow label="Name" value={profile?.name || "Not set"} />
            <InfoRow label="Weight Class" value={profile?.weight_class || "Not set"} />
            <InfoRow
              label="Training"
              value={
                profile?.gi && profile?.nogi
                  ? "Gi & No-Gi"
                  : profile?.gi
                    ? "Gi"
                    : profile?.nogi
                      ? "No-Gi"
                      : "Not set"
              }
            />
            <InfoRow
              label="Units"
              value={profile?.unit_system === "imperial" ? "Imperial" : "Metric"}
            />
            <View style={infoStyles.row}>
              <Text style={infoStyles.label}>Goals</Text>
              <Text
                style={[infoStyles.value, { flex: 1, textAlign: "right" }]}
                numberOfLines={1}
              >
                {profile?.training_goals || "Not set"}
              </Text>
            </View>
          </View>
        </View>

        {/* Member Since */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account</Text>
          <View style={styles.infoCard}>
            <InfoRow
              label="Member since"
              value={
                profile?.created_at
                  ? formatMemberSince(profile.created_at)
                  : "--"
              }
            />
          </View>
        </View>

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
  email: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  editButton: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: colors.accent,
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Sign out
  signOutButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.accent,
    marginTop: 8,
  },
  signOutText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 16,
    color: colors.accent,
  },
});
