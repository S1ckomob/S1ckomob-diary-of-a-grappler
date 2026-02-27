import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useSession } from "../hooks/useSession";
import type { Profile } from "../types";
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

type Props = NativeStackScreenProps<ProfileStackParamList, "Settings">;

const SESSION_TYPES = [
  { key: "rolling", label: "Rolling" },
  { key: "drilling", label: "Drilling" },
  { key: "competition", label: "Competition" },
];

const DURATIONS = [30, 45, 60, 90, 120];

// --- Toggle Row ---

function ToggleRow({
  label,
  value,
  onToggle,
  icon,
}: {
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  icon?: string;
}) {
  return (
    <View style={rowStyles.container}>
      {icon && (
        <Ionicons
          name={icon as any}
          size={18}
          color={colors.textSecondary}
          style={rowStyles.icon}
        />
      )}
      <Text style={rowStyles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.surfaceRaised, true: colors.accent + "60" }}
        thumbColor={value ? colors.accent : colors.textMuted}
      />
    </View>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  icon: {
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: colors.textPrimary,
  },
});

// --- Nav Row (tappable) ---

function NavRow({
  label,
  icon,
  onPress,
  destructive,
}: {
  label: string;
  icon: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <TouchableOpacity
      style={navRowStyles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon as any}
        size={18}
        color={destructive ? colors.accent : colors.textSecondary}
        style={navRowStyles.icon}
      />
      <Text
        style={[
          navRowStyles.label,
          destructive && navRowStyles.destructive,
        ]}
      >
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const navRowStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  icon: {
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: colors.textPrimary,
  },
  destructive: {
    color: colors.accent,
  },
});

// --- Main Screen ---

export default function SettingsScreen({ navigation }: Props) {
  const { session: authSession } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings state
  const [notifyTraining, setNotifyTraining] = useState(true);
  const [notifyStreak, setNotifyStreak] = useState(true);
  const [notifyCoach, setNotifyCoach] = useState(true);
  const [notifyComp, setNotifyComp] = useState(true);
  const [profileVisible, setProfileVisible] = useState(true);
  const [defaultSessionType, setDefaultSessionType] = useState("rolling");
  const [defaultDuration, setDefaultDuration] = useState(60);
  const [unitSystem, setUnitSystem] = useState("metric");

  // Account
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showEmailField, setShowEmailField] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!authSession?.user) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authSession.user.id)
      .single();
    if (data) {
      const p = data as Profile;
      setProfile(p);
      setNotifyTraining(p.notify_training_reminders ?? true);
      setNotifyStreak(p.notify_streak_alerts ?? true);
      setNotifyCoach(p.notify_coach_messages ?? true);
      setNotifyComp(p.notify_comp_reminders ?? true);
      setProfileVisible(p.profile_visible ?? true);
      setDefaultSessionType(p.default_session_type ?? "rolling");
      setDefaultDuration(p.default_duration ?? 60);
      setUnitSystem(p.unit_system ?? "metric");
    }
    setLoading(false);
  }, [authSession?.user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const saveSettings = useCallback(
    async (updates: Record<string, unknown>) => {
      if (!authSession?.user) return;
      setSaving(true);
      await supabase
        .from("profiles")
        .update(updates)
        .eq("id", authSession.user.id);
      setSaving(false);
    },
    [authSession?.user]
  );

  // Toggle handlers that save immediately
  const toggleAndSave = (
    setter: (v: boolean) => void,
    field: string,
    newVal: boolean
  ) => {
    setter(newVal);
    saveSettings({ [field]: newVal });
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) return;
    const { error } = await supabase.auth.updateUser({
      email: newEmail.trim(),
    });
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Check Your Email", "A confirmation link has been sent to your new email.");
      setNewEmail("");
      setShowEmailField(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Success", "Password updated successfully.");
      setNewPassword("");
      setShowPasswordField(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // Sign out (actual deletion requires server-side admin call)
            await supabase.auth.signOut();
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const currentEmail = authSession?.user?.email || "";
  const plan = profile?.subscription_plan || "free";

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
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        {saving && (
          <View style={styles.savingBanner}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.savingText}>Saving...</Text>
          </View>
        )}

        {/* ===== Account ===== */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.card}>
          <View style={styles.emailRow}>
            <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.emailText}>{currentEmail}</Text>
          </View>

          {showEmailField ? (
            <View style={styles.inlineField}>
              <TextInput
                style={styles.inlineInput}
                placeholder="New email address"
                placeholderTextColor={colors.textMuted}
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="off"
              />
              <TouchableOpacity
                style={styles.inlineBtn}
                onPress={handleChangeEmail}
              >
                <Text style={styles.inlineBtnText}>Update</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowEmailField(false)}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ) : (
            <NavRow
              label="Change Email"
              icon="mail-outline"
              onPress={() => setShowEmailField(true)}
            />
          )}

          {showPasswordField ? (
            <View style={styles.inlineField}>
              <TextInput
                style={styles.inlineInput}
                placeholder="New password (min 6 chars)"
                placeholderTextColor={colors.textMuted}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoComplete="off"
              />
              <TouchableOpacity
                style={styles.inlineBtn}
                onPress={handleChangePassword}
              >
                <Text style={styles.inlineBtnText}>Update</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowPasswordField(false)}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ) : (
            <NavRow
              label="Change Password"
              icon="lock-closed-outline"
              onPress={() => setShowPasswordField(true)}
            />
          )}

          <NavRow
            label="Delete Account"
            icon="trash-outline"
            onPress={handleDeleteAccount}
            destructive
          />
        </View>

        {/* ===== Notifications ===== */}
        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <View style={styles.card}>
          <ToggleRow
            label="Training Reminders"
            icon="fitness-outline"
            value={notifyTraining}
            onToggle={(v) =>
              toggleAndSave(setNotifyTraining, "notify_training_reminders", v)
            }
          />
          <ToggleRow
            label="Streak Alerts"
            icon="flame-outline"
            value={notifyStreak}
            onToggle={(v) =>
              toggleAndSave(setNotifyStreak, "notify_streak_alerts", v)
            }
          />
          <ToggleRow
            label="Coach Messages"
            icon="chatbubble-outline"
            value={notifyCoach}
            onToggle={(v) =>
              toggleAndSave(setNotifyCoach, "notify_coach_messages", v)
            }
          />
          <ToggleRow
            label="Competition Reminders"
            icon="trophy-outline"
            value={notifyComp}
            onToggle={(v) =>
              toggleAndSave(setNotifyComp, "notify_comp_reminders", v)
            }
          />
        </View>

        {/* ===== Training Preferences ===== */}
        <Text style={styles.sectionLabel}>TRAINING PREFERENCES</Text>
        <View style={styles.card}>
          <Text style={styles.prefLabel}>Default Session Type</Text>
          <View style={styles.chipsRow}>
            {SESSION_TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[
                  styles.chip,
                  defaultSessionType === t.key && styles.chipActive,
                ]}
                onPress={() => {
                  setDefaultSessionType(t.key);
                  saveSettings({ default_session_type: t.key });
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    defaultSessionType === t.key && styles.chipTextActive,
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.prefLabel}>Default Duration</Text>
          <View style={styles.chipsRow}>
            {DURATIONS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.chip,
                  defaultDuration === d && styles.chipActive,
                ]}
                onPress={() => {
                  setDefaultDuration(d);
                  saveSettings({ default_duration: d });
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    defaultDuration === d && styles.chipTextActive,
                  ]}
                >
                  {d}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.prefLabel}>Unit System</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                unitSystem === "metric" && styles.toggleBtnActive,
              ]}
              onPress={() => {
                setUnitSystem("metric");
                saveSettings({ unit_system: "metric" });
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.toggleText,
                  unitSystem === "metric" && styles.toggleTextActive,
                ]}
              >
                Metric (kg)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                unitSystem === "imperial" && styles.toggleBtnActive,
              ]}
              onPress={() => {
                setUnitSystem("imperial");
                saveSettings({ unit_system: "imperial" });
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.toggleText,
                  unitSystem === "imperial" && styles.toggleTextActive,
                ]}
              >
                Imperial (lbs)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== Privacy ===== */}
        <Text style={styles.sectionLabel}>PRIVACY</Text>
        <View style={styles.card}>
          <ToggleRow
            label="Profile Visible to Gym Members"
            icon="eye-outline"
            value={profileVisible}
            onToggle={(v) =>
              toggleAndSave(setProfileVisible, "profile_visible", v)
            }
          />
          <Text style={styles.privacyHint}>
            When off, only you and your coach can see your profile and stats.
          </Text>
        </View>

        {/* ===== Subscription ===== */}
        <Text style={styles.sectionLabel}>SUBSCRIPTION</Text>
        <View style={styles.card}>
          <View style={styles.planRow}>
            <View style={styles.planInfo}>
              <Text style={styles.planName}>
                {plan === "pro" ? "Pro" : "Free"} Plan
              </Text>
              <Text style={styles.planDesc}>
                {plan === "pro"
                  ? "Unlimited access to all features"
                  : "Basic features included"}
              </Text>
            </View>
            <View
              style={[
                styles.planBadge,
                plan === "pro" && styles.planBadgePro,
              ]}
            >
              <Text
                style={[
                  styles.planBadgeText,
                  plan === "pro" && styles.planBadgeTextPro,
                ]}
              >
                {plan === "pro" ? "PRO" : "FREE"}
              </Text>
            </View>
          </View>
          {plan !== "pro" && (
            <TouchableOpacity
              style={styles.upgradeBtn}
              activeOpacity={0.8}
              onPress={() =>
                Alert.alert("Coming Soon", "Pro subscriptions will be available soon!")
              }
            >
              <Ionicons name="star" size={16} color={colors.textPrimary} />
              <Text style={styles.upgradeBtnText}>Upgrade to Pro</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ===== About ===== */}
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.card}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>App Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <NavRow
            label="Terms of Service"
            icon="document-text-outline"
            onPress={() =>
              Alert.alert("Terms of Service", "Terms of Service will be available at launch.")
            }
          />
          <NavRow
            label="Privacy Policy"
            icon="shield-outline"
            onPress={() =>
              Alert.alert("Privacy Policy", "Privacy Policy will be available at launch.")
            }
          />
        </View>

        {/* ===== Sign Out ===== */}
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
    paddingTop: Platform.OS === "ios" ? 56 : 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 20,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 24,
  },

  // Saving
  savingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    marginBottom: 8,
  },
  savingText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: colors.textMuted,
  },

  // Sections
  sectionLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 10,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Account email
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  emailText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Inline edit fields
  inlineField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  inlineInput: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textPrimary,
  },
  inlineBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inlineBtnText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: colors.textPrimary,
  },

  // Preferences
  prefLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 14,
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.accent + "18",
    borderColor: colors.accent,
  },
  chipText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.accent,
  },

  // Toggle buttons
  toggleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  toggleBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleBtnActive: {
    backgroundColor: colors.accent + "18",
    borderColor: colors.accent,
  },
  toggleText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.accent,
  },

  // Privacy
  privacyHint: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: colors.textMuted,
    paddingVertical: 10,
    lineHeight: 18,
  },

  // Plan
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: colors.textPrimary,
  },
  planDesc: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  planBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.surfaceRaised,
  },
  planBadgePro: {
    backgroundColor: colors.gold + "20",
  },
  planBadgeText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 11,
    color: colors.textMuted,
  },
  planBadgeTextPro: {
    color: colors.gold,
  },
  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.gold,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 4,
    marginBottom: 10,
  },
  upgradeBtnText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 14,
    color: colors.textPrimary,
  },

  // About
  aboutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  aboutLabel: {
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: colors.textPrimary,
  },
  aboutValue: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textMuted,
  },

  // Sign Out
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.accent + "40",
    marginTop: 32,
  },
  signOutText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: colors.accent,
  },
});
