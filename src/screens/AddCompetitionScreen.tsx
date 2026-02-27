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
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import { useSession } from "../hooks/useSession";

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

const DIVISIONS = ["Adult", "Master 1", "Master 2", "Master 3", "Juvenile"];

const WEIGHT_CLASSES = [
  "Rooster",
  "Light Feather",
  "Feather",
  "Light",
  "Middle",
  "Medium Heavy",
  "Heavy",
  "Super Heavy",
  "Ultra Heavy",
  "Open",
];

// --- Main Screen ---

export default function AddCompetitionScreen() {
  const navigation = useNavigation();
  const { session: authSession } = useSession();

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [division, setDivision] = useState("Adult");
  const [weightClass, setWeightClass] = useState("");
  const [gi, setGi] = useState(true);
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0 && date.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave || !authSession?.user) return;

    // Basic date validation (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date.trim())) {
      Alert.alert("Invalid Date", "Please enter date as YYYY-MM-DD.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("competitions").insert({
      user_id: authSession.user.id,
      name: name.trim(),
      date: date.trim(),
      location: location.trim() || null,
      division: division || null,
      weight_class: weightClass || null,
      gi,
      completed: false,
    });

    setSaving(false);

    if (error) {
      Alert.alert("Error", "Could not save competition. Please try again.");
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
            <Text style={styles.headerTitle}>Add Competition</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Name */}
          <Text style={styles.fieldLabel}>Competition Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. IBJJF Pan American"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            maxLength={100}
            autoComplete="off"
          />

          {/* Date */}
          <Text style={styles.fieldLabel}>Date</Text>
          <TextInput
            style={styles.textInput}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            value={date}
            onChangeText={setDate}
            maxLength={10}
            autoComplete="off"
          />

          {/* Location */}
          <Text style={styles.fieldLabel}>Location (optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="City, State"
            placeholderTextColor={colors.textMuted}
            value={location}
            onChangeText={setLocation}
            maxLength={100}
            autoComplete="off"
          />

          {/* Division */}
          <Text style={styles.fieldLabel}>Division</Text>
          <View style={styles.chipsRow}>
            {DIVISIONS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.chip, division === d && styles.chipActive]}
                onPress={() => setDivision(d)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    division === d && styles.chipTextActive,
                  ]}
                >
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Weight Class */}
          <Text style={styles.fieldLabel}>Weight Class</Text>
          <View style={styles.chipsRow}>
            {WEIGHT_CLASSES.map((w) => (
              <TouchableOpacity
                key={w}
                style={[styles.chip, weightClass === w && styles.chipActive]}
                onPress={() => setWeightClass(weightClass === w ? "" : w)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    weightClass === w && styles.chipTextActive,
                  ]}
                >
                  {w}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Gi / No-Gi */}
          <Text style={styles.fieldLabel}>Format</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, gi && styles.toggleBtnActive]}
              onPress={() => setGi(true)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.toggleText,
                  gi && styles.toggleTextActive,
                ]}
              >
                Gi
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, !gi && styles.toggleBtnActive]}
              onPress={() => setGi(false)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.toggleText,
                  !gi && styles.toggleTextActive,
                ]}
              >
                No-Gi
              </Text>
            </TouchableOpacity>
          </View>

          {/* Save */}
          <TouchableOpacity
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={!canSave}
          >
            {saving ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={styles.saveButtonText}>Add Competition</Text>
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
  textInput: {
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

  // Chips
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.gold,
  },
  chipText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.gold,
  },

  // Toggle
  toggleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 32,
  },
  toggleBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleBtnActive: {
    backgroundColor: colors.accent + "18",
    borderColor: colors.accent,
  },
  toggleText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.accent,
  },

  // Save
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: colors.textPrimary,
  },
});
