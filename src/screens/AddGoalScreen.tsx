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
import type { CoachStackParamList } from "../navigation";

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

type Props = NativeStackScreenProps<CoachStackParamList, "AddGoal">;

const GOAL_TYPES = [
  { key: "Sessions", icon: "\u{1F94B}" },
  { key: "Mat Time", icon: "\u{23F1}\u{FE0F}" },
  { key: "Submissions", icon: "\u{1F4A5}" },
  { key: "Competitions", icon: "\u{1F3C6}" },
  { key: "Techniques", icon: "\u{1F4D6}" },
  { key: "Custom", icon: "\u{2B50}" },
];

const UNIT_MAP: Record<string, string> = {
  Sessions: "sessions",
  "Mat Time": "hours",
  Submissions: "subs",
  Competitions: "comps",
  Techniques: "techniques",
};

export default function AddGoalScreen({ navigation }: Props) {
  const { session: authSession } = useSession();

  const [goalType, setGoalType] = useState("Sessions");
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState("");
  const [customUnit, setCustomUnit] = useState("");
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const unit = goalType === "Custom" ? customUnit.trim() : UNIT_MAP[goalType] || "";

  const handleSave = async () => {
    if (!authSession?.user) return;

    const targetNum = parseInt(target, 10);
    if (!target.trim() || isNaN(targetNum) || targetNum <= 0) {
      Alert.alert("Set a target", "Please enter a target number for your goal.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("goals").insert({
      user_id: authSession.user.id,
      goal_type: goalType,
      description: description.trim() || null,
      target: targetNum,
      current: 0,
      unit: unit || null,
      month: currentMonth,
      year: currentYear,
      set_by_coach: false,
    });

    setSaving(false);

    if (error) {
      Alert.alert("Error", "Could not save goal. Please try again.");
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
            <Text style={styles.headerTitle}>New Goal</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Goal Type */}
          <Text style={styles.fieldLabel}>Goal Type</Text>
          <View style={styles.typeGrid}>
            {GOAL_TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[
                  styles.typeChip,
                  goalType === t.key && styles.typeChipActive,
                ]}
                onPress={() => setGoalType(t.key)}
                activeOpacity={0.7}
              >
                <Text style={styles.typeIcon}>{t.icon}</Text>
                <Text
                  style={[
                    styles.typeLabel,
                    goalType === t.key && styles.typeLabelActive,
                  ]}
                >
                  {t.key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Target */}
          <Text style={styles.fieldLabel}>Target</Text>
          <View style={styles.targetRow}>
            <TextInput
              style={styles.targetInput}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              value={target}
              onChangeText={(t) => setTarget(t.replace(/[^0-9]/g, ""))}
              maxLength={4}
            />
            {unit ? <Text style={styles.targetUnit}>{unit}</Text> : null}
          </View>

          {/* Custom Unit */}
          {goalType === "Custom" && (
            <>
              <Text style={styles.fieldLabel}>Unit (optional)</Text>
              <TextInput
                style={styles.unitInput}
                placeholder="e.g. reps, rounds, hours"
                placeholderTextColor={colors.textMuted}
                value={customUnit}
                onChangeText={setCustomUnit}
                maxLength={20}
              />
            </>
          )}

          {/* Description */}
          <Text style={styles.fieldLabel}>Description (optional)</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="What does this goal mean to you?"
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
            maxLength={200}
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
              <Text style={styles.saveButtonText}>Save Goal</Text>
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

  // Fields
  fieldLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 10,
    marginTop: 4,
  },

  // Goal type grid
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 28,
  },
  typeChip: {
    width: "30%",
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  typeChipActive: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.gold,
  },
  typeIcon: {
    fontSize: 20,
  },
  typeLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    color: colors.textSecondary,
  },
  typeLabelActive: {
    color: colors.gold,
  },

  // Target
  targetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 28,
  },
  targetInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "DMSans_700Bold",
    fontSize: 24,
    color: colors.textPrimary,
    textAlign: "center",
  },
  targetUnit: {
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: colors.textMuted,
  },

  // Unit
  unitInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 24,
  },

  // Description
  descriptionInput: {
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
    minHeight: 90,
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
