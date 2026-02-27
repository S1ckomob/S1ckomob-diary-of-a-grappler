import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import { useSession } from "../hooks/useSession";
import type { SessionType } from "../types";
import type { JournalStackParamList } from "../navigation";

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
  inputBg: "#11111A",
  danger: "#C41E3A",
};

// --- Types ---

type Props = NativeStackScreenProps<JournalStackParamList, "LogSession">;

const SESSION_TYPES: { key: SessionType; label: string; icon: string }[] = [
  { key: "rolling", label: "Rolling", icon: "\u{1F94B}" },
  { key: "drilling", label: "Drilling", icon: "\u{1F527}" },
  { key: "competition", label: "Comp", icon: "\u{1F3C6}" },
];

const DURATION_PRESETS = [30, 45, 60, 90, 120];

// --- Stepper ---

function Stepper({
  value,
  onIncrement,
  onDecrement,
  min = 0,
}: {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
}) {
  return (
    <View style={stepperStyles.container}>
      <TouchableOpacity
        style={[stepperStyles.button, value <= min && stepperStyles.buttonDisabled]}
        onPress={onDecrement}
        disabled={value <= min}
        activeOpacity={0.7}
      >
        <Text
          style={[
            stepperStyles.buttonText,
            value <= min && stepperStyles.buttonTextDisabled,
          ]}
        >
          -
        </Text>
      </TouchableOpacity>
      <Text style={stepperStyles.value}>{value}</Text>
      <TouchableOpacity
        style={stepperStyles.button}
        onPress={onIncrement}
        activeOpacity={0.7}
      >
        <Text style={stepperStyles.buttonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const stepperStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  button: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  buttonText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 20,
    color: colors.textPrimary,
  },
  buttonTextDisabled: {
    color: colors.textMuted,
  },
  value: {
    fontFamily: "DMSans_700Bold",
    fontSize: 18,
    color: colors.textPrimary,
    minWidth: 36,
    textAlign: "center",
  },
});

// --- Main Screen ---

export default function LogSessionScreen({ navigation }: Props) {
  const { session: authSession } = useSession();

  const [sessionType, setSessionType] = useState<SessionType>("rolling");
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [customDuration, setCustomDuration] = useState("");
  const [rounds, setRounds] = useState(0);
  const [tapsGiven, setTapsGiven] = useState(0);
  const [tapsReceived, setTapsReceived] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const handleDurationPreset = (mins: number) => {
    setDurationMinutes(mins);
    setCustomDuration("");
  };

  const handleCustomDurationChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    setCustomDuration(cleaned);
    const num = parseInt(cleaned, 10);
    setDurationMinutes(num > 0 ? num : null);
  };

  const handleSave = async () => {
    if (!authSession?.user) return;

    setSaving(true);

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const { error } = await supabase.from("sessions").insert({
      user_id: authSession.user.id,
      date: todayStr,
      session_type: sessionType,
      duration_minutes: durationMinutes,
      notes: notes.trim() || null,
      rounds: rounds > 0 ? rounds : null,
      taps_given: tapsGiven,
      taps_received: tapsReceived,
    });

    setSaving(false);

    if (error) {
      Alert.alert("Error", "Could not save session. Please try again.");
      return;
    }

    navigation.goBack();
  };

  const isCustomActive =
    durationMinutes !== null && !DURATION_PRESETS.includes(durationMinutes);

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Log Session</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Date */}
          <Text style={styles.dateLabel}>{dateLabel}</Text>

          {/* Session Type */}
          <Text style={styles.fieldLabel}>Session Type</Text>
          <View style={styles.typeRow}>
            {SESSION_TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[
                  styles.typeChip,
                  sessionType === t.key && styles.typeChipActive,
                ]}
                onPress={() => setSessionType(t.key)}
                activeOpacity={0.7}
              >
                <Text style={styles.typeIcon}>{t.icon}</Text>
                <Text
                  style={[
                    styles.typeLabel,
                    sessionType === t.key && styles.typeLabelActive,
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Duration */}
          <Text style={styles.fieldLabel}>Duration</Text>
          <View style={styles.durationRow}>
            {DURATION_PRESETS.map((mins) => (
              <TouchableOpacity
                key={mins}
                style={[
                  styles.durationChip,
                  durationMinutes === mins &&
                    !isCustomActive &&
                    styles.durationChipActive,
                ]}
                onPress={() => handleDurationPreset(mins)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.durationChipText,
                    durationMinutes === mins &&
                      !isCustomActive &&
                      styles.durationChipTextActive,
                  ]}
                >
                  {mins}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.customDurationRow}>
            <TextInput
              style={[
                styles.customDurationInput,
                isCustomActive && styles.customDurationInputActive,
              ]}
              placeholder="Custom"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              value={customDuration}
              onChangeText={handleCustomDurationChange}
              maxLength={3}
            />
            <Text style={styles.customDurationUnit}>min</Text>
          </View>

          {/* Rounds */}
          <View style={styles.stepperRow}>
            <View style={styles.stepperLabel}>
              <Text style={styles.fieldLabel}>Rounds</Text>
              <Text style={styles.fieldHint}>Optional</Text>
            </View>
            <Stepper
              value={rounds}
              onIncrement={() => setRounds((r) => r + 1)}
              onDecrement={() => setRounds((r) => r - 1)}
            />
          </View>

          {/* Taps */}
          <View style={styles.stepperRow}>
            <View style={styles.stepperLabel}>
              <Text style={styles.fieldLabel}>Submissions</Text>
              <Text style={styles.fieldHint}>Taps you got</Text>
            </View>
            <Stepper
              value={tapsGiven}
              onIncrement={() => setTapsGiven((t) => t + 1)}
              onDecrement={() => setTapsGiven((t) => t - 1)}
            />
          </View>

          <View style={styles.stepperRow}>
            <View style={styles.stepperLabel}>
              <Text style={styles.fieldLabel}>Tapped</Text>
              <Text style={styles.fieldHint}>Times you tapped</Text>
            </View>
            <Stepper
              value={tapsReceived}
              onIncrement={() => setTapsReceived((t) => t + 1)}
              onDecrement={() => setTapsReceived((t) => t - 1)}
            />
          </View>

          {/* Notes */}
          <Text style={styles.fieldLabel}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="What did you work on? How did it go?"
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            value={notes}
            onChangeText={setNotes}
            maxLength={1000}
          />

          {/* Save */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={styles.saveButtonText}>Save Session</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
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
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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

  // Date
  dateLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: colors.gold,
    marginBottom: 28,
    marginTop: 4,
  },

  // Field label
  fieldLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  fieldHint: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Session type
  typeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
  },
  typeChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  typeIcon: {
    fontSize: 16,
  },
  typeLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: colors.textSecondary,
  },
  typeLabelActive: {
    color: colors.textPrimary,
  },

  // Duration
  durationRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  durationChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  durationChipActive: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.gold,
  },
  durationChipText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: colors.textSecondary,
  },
  durationChipTextActive: {
    color: colors.gold,
  },
  customDurationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 28,
  },
  customDurationInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textPrimary,
  },
  customDurationInputActive: {
    borderColor: colors.gold,
  },
  customDurationUnit: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textMuted,
  },

  // Steppers
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  stepperLabel: {
    flex: 1,
  },

  // Notes
  notesInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 120,
    lineHeight: 22,
    marginBottom: 32,
  },

  // Save
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: colors.textPrimary,
  },
});
