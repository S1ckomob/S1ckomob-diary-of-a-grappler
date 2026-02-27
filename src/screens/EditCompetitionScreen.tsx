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
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import type { CompResult } from "../types";
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

type Props = NativeStackScreenProps<CompeteStackParamList, "EditCompetition">;

const RESULTS: {
  key: NonNullable<CompResult>;
  label: string;
  color: string;
  emoji: string;
}[] = [
  { key: "gold", label: "Gold", color: colors.gold, emoji: "\u{1F947}" },
  { key: "silver", label: "Silver", color: colors.silver, emoji: "\u{1F948}" },
  { key: "bronze", label: "Bronze", color: colors.bronze, emoji: "\u{1F949}" },
  { key: "dnp", label: "DNP", color: colors.textMuted, emoji: "" },
];

// --- Main Screen ---

export default function EditCompetitionScreen({ navigation, route }: Props) {
  const { competition } = route.params;

  const [completed, setCompleted] = useState(competition.completed);
  const [result, setResult] = useState<CompResult>(competition.result);
  const [matchesWon, setMatchesWon] = useState(
    String(competition.matches_won)
  );
  const [matchesLost, setMatchesLost] = useState(
    String(competition.matches_lost)
  );
  const [notes, setNotes] = useState(competition.notes || "");
  const [saving, setSaving] = useState(false);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleSave = async () => {
    setSaving(true);

    const { error } = await supabase
      .from("competitions")
      .update({
        completed,
        result: completed ? result : null,
        matches_won: parseInt(matchesWon, 10) || 0,
        matches_lost: parseInt(matchesLost, 10) || 0,
        notes: notes.trim() || null,
      })
      .eq("id", competition.id);

    setSaving(false);

    if (error) {
      Alert.alert("Error", "Could not save changes. Please try again.");
      return;
    }

    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Competition",
      `Delete "${competition.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await supabase
              .from("competitions")
              .delete()
              .eq("id", competition.id);
            navigation.goBack();
          },
        },
      ]
    );
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
            <Text style={styles.headerTitle}>Edit Result</Text>
            <TouchableOpacity
              onPress={handleDelete}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="trash-outline" size={20} color={colors.accent} />
            </TouchableOpacity>
          </View>

          {/* Competition Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.compName}>{competition.name}</Text>
            <Text style={styles.compDate}>{formatDate(competition.date)}</Text>
            {competition.location && (
              <Text style={styles.compLocation}>{competition.location}</Text>
            )}
            <View style={styles.infoTags}>
              {competition.division && (
                <View style={styles.infoTag}>
                  <Text style={styles.infoTagText}>
                    {competition.division}
                  </Text>
                </View>
              )}
              <View style={styles.infoTag}>
                <Text style={styles.infoTagText}>
                  {competition.gi ? "Gi" : "No-Gi"}
                </Text>
              </View>
              {competition.weight_class && (
                <View style={styles.infoTag}>
                  <Text style={styles.infoTagText}>
                    {competition.weight_class}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Completed Toggle */}
          <Text style={styles.fieldLabel}>Status</Text>
          <TouchableOpacity
            style={[
              styles.completedToggle,
              completed && styles.completedToggleActive,
            ]}
            onPress={() => setCompleted(!completed)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={completed ? "checkmark-circle" : "ellipse-outline"}
              size={22}
              color={completed ? colors.green : colors.textMuted}
            />
            <Text
              style={[
                styles.completedText,
                completed && styles.completedTextActive,
              ]}
            >
              {completed ? "Completed" : "Mark as Completed"}
            </Text>
          </TouchableOpacity>

          {/* Result (shown when completed) */}
          {completed && (
            <>
              <Text style={styles.fieldLabel}>Result</Text>
              <View style={styles.resultsRow}>
                {RESULTS.map((r) => (
                  <TouchableOpacity
                    key={r.key}
                    style={[
                      styles.resultChip,
                      result === r.key && {
                        backgroundColor: r.color + "20",
                        borderColor: r.color,
                      },
                    ]}
                    onPress={() =>
                      setResult(result === r.key ? null : r.key)
                    }
                    activeOpacity={0.7}
                  >
                    {r.emoji ? (
                      <Text style={styles.resultEmoji}>{r.emoji}</Text>
                    ) : null}
                    <Text
                      style={[
                        styles.resultChipText,
                        result === r.key && { color: r.color },
                      ]}
                    >
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Matches */}
              <Text style={styles.fieldLabel}>Match Record</Text>
              <View style={styles.matchRow}>
                <View style={styles.matchField}>
                  <Text style={styles.matchLabel}>Won</Text>
                  <TextInput
                    style={styles.matchInput}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    value={matchesWon}
                    onChangeText={(t) =>
                      setMatchesWon(t.replace(/[^0-9]/g, ""))
                    }
                    maxLength={2}
                    autoComplete="off"
                  />
                </View>
                <Text style={styles.matchDash}>-</Text>
                <View style={styles.matchField}>
                  <Text style={styles.matchLabel}>Lost</Text>
                  <TextInput
                    style={styles.matchInput}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    value={matchesLost}
                    onChangeText={(t) =>
                      setMatchesLost(t.replace(/[^0-9]/g, ""))
                    }
                    maxLength={2}
                    autoComplete="off"
                  />
                </View>
              </View>
            </>
          )}

          {/* Notes */}
          <Text style={styles.fieldLabel}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="How did it go? Key takeaways..."
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            value={notes}
            onChangeText={setNotes}
            maxLength={500}
            autoComplete="off"
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
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// --- Styles ---

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
    paddingTop: Platform.OS === "ios" ? 16 : 20,
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

  // Info Card
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    marginTop: 8,
  },
  compName: {
    fontFamily: "DMSans_700Bold",
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  compDate: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  compLocation: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 2,
  },
  infoTags: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
  },
  infoTag: {
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  infoTagText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 11,
    color: colors.textSecondary,
  },

  // Fields
  fieldLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 10,
    marginTop: 4,
  },

  // Completed Toggle
  completedToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  completedToggleActive: {
    backgroundColor: colors.green + "10",
    borderColor: colors.green + "40",
  },
  completedText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: colors.textMuted,
  },
  completedTextActive: {
    color: colors.green,
  },

  // Results
  resultsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  resultChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultEmoji: {
    fontSize: 14,
  },
  resultChipText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Match Record
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  matchField: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  matchLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    color: colors.textMuted,
  },
  matchInput: {
    width: "100%",
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
  matchDash: {
    fontFamily: "DMSans_700Bold",
    fontSize: 20,
    color: colors.textMuted,
    marginTop: 20,
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
    minHeight: 100,
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
