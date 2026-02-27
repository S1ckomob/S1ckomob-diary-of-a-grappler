import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import { useSession } from "../hooks/useSession";
import type { CoachStackParamList } from "../navigation";

// --- Theme ---

const colors = {
  background: "#08080D",
  surface: "#11111A",
  accent: "#C41E3A",
  gold: "#C9A84C",
  green: "#2D8E4E",
  textPrimary: "#FFFFFF",
  textSecondary: "#9A9AA0",
  textMuted: "#5A5A64",
  border: "#1E1E2A",
};

type Props = NativeStackScreenProps<CoachStackParamList, "JoinGym">;

export default function JoinGymScreen({ navigation }: Props) {
  const { session: authSession } = useSession();
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);

  const handleJoin = async () => {
    if (!authSession?.user) return;
    const trimmed = code.trim();
    if (!trimmed) {
      Alert.alert("Enter a code", "Please enter the gym code from your coach.");
      return;
    }

    setSaving(true);

    // Look up gym by code
    const { data: gym, error: gymError } = await supabase
      .from("gyms")
      .select("id, coach_id")
      .eq("code", trimmed)
      .single();

    if (gymError || !gym) {
      setSaving(false);
      Alert.alert("Not found", "No gym found with that code. Check with your coach.");
      return;
    }

    // Update profile with gym_id and coach_id
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ gym_id: gym.id, coach_id: gym.coach_id })
      .eq("id", authSession.user.id);

    setSaving(false);

    if (updateError) {
      Alert.alert("Error", "Could not join gym. Please try again.");
      return;
    }

    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Join Gym</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Illustration */}
          <View style={styles.illustrationArea}>
            <Text style={styles.illustrationIcon}>{"\u{1F3E0}"}</Text>
            <Text style={styles.subtitle}>
              Enter the gym code from your coach to connect and start receiving
              goals and feedback.
            </Text>
          </View>

          {/* Code input */}
          <Text style={styles.fieldLabel}>Gym Code</Text>
          <TextInput
            style={styles.codeInput}
            placeholder="e.g. BJJ-ACADEMY-2024"
            placeholderTextColor={colors.textMuted}
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={30}
          />

          {/* Join button */}
          <TouchableOpacity
            style={[styles.joinButton, saving && styles.joinButtonDisabled]}
            onPress={handleJoin}
            activeOpacity={0.8}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={styles.joinButtonText}>Join Gym</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 8,
  },
  cancelText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 16,
    color: colors.textSecondary,
  },
  headerTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 18,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 56,
  },

  // Illustration
  illustrationArea: {
    alignItems: "center",
    paddingTop: 36,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  illustrationIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },

  // Input
  fieldLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  codeInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontFamily: "DMSans_500Medium",
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: "center",
    letterSpacing: 2,
    marginBottom: 24,
  },

  // Button
  joinButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: colors.textPrimary,
  },
});
