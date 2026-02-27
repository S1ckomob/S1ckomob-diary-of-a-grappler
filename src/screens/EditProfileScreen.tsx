import React, { useCallback, useEffect, useState } from "react";
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

// --- Types ---

type Props = NativeStackScreenProps<ProfileStackParamList, "EditProfile">;

const BELTS: { key: Belt; label: string; color: string }[] = [
  { key: "white", label: "White", color: "#E8E8E8" },
  { key: "blue", label: "Blue", color: "#1A5CCF" },
  { key: "purple", label: "Purple", color: "#7B2D8E" },
  { key: "brown", label: "Brown", color: "#6B3A2A" },
  { key: "black", label: "Black", color: "#1C1C1E" },
];

const STRIPE_OPTIONS = [0, 1, 2, 3, 4];

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
];

const DNA_FIELDS: { key: string; label: string }[] = [
  { key: "dna_guard", label: "Guard" },
  { key: "dna_passing", label: "Passing" },
  { key: "dna_submissions", label: "Submissions" },
  { key: "dna_takedowns", label: "Takedowns" },
  { key: "dna_escapes", label: "Escapes" },
];

// --- Chip Selector ---

function ChipSelector<T extends string | number>({
  options,
  selected,
  onSelect,
  renderLabel,
  renderDot,
}: {
  options: T[];
  selected: T;
  onSelect: (val: T) => void;
  renderLabel: (val: T) => string;
  renderDot?: (val: T) => string | null;
}) {
  return (
    <View style={chipStyles.row}>
      {options.map((opt) => {
        const active = opt === selected;
        const dot = renderDot?.(opt);
        return (
          <TouchableOpacity
            key={String(opt)}
            style={[chipStyles.chip, active && chipStyles.chipActive]}
            onPress={() => onSelect(opt)}
            activeOpacity={0.7}
          >
            {dot && (
              <View
                style={[chipStyles.dot, { backgroundColor: dot }]}
              />
            )}
            <Text
              style={[
                chipStyles.chipText,
                active && chipStyles.chipTextActive,
              ]}
            >
              {renderLabel(opt)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const chipStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chipText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.gold,
  },
});

// --- Toggle Row ---

function ToggleRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      style={toggleStyles.row}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <Text style={toggleStyles.label}>{label}</Text>
      <View style={[toggleStyles.track, value && toggleStyles.trackActive]}>
        <View
          style={[toggleStyles.thumb, value && toggleStyles.thumbActive]}
        />
      </View>
    </TouchableOpacity>
  );
}

const toggleStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: colors.textPrimary,
  },
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  trackActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.textMuted,
  },
  thumbActive: {
    alignSelf: "flex-end",
    backgroundColor: colors.textPrimary,
  },
});

// --- DNA Slider ---

function dnaBarColor(value: number): string {
  if (value >= 70) return colors.green;
  if (value >= 40) return colors.gold;
  return colors.accent;
}

function DnaSlider({
  label,
  value,
  onDecrease,
  onIncrease,
}: {
  label: string;
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  const barColor = dnaBarColor(value);
  return (
    <View style={dnaStyles.container}>
      <View style={dnaStyles.labelRow}>
        <Text style={dnaStyles.label}>{label}</Text>
        <Text style={[dnaStyles.value, { color: barColor }]}>{value}</Text>
      </View>
      <View style={dnaStyles.sliderRow}>
        <TouchableOpacity
          style={dnaStyles.button}
          onPress={onDecrease}
          activeOpacity={0.7}
        >
          <Text style={dnaStyles.buttonText}>-</Text>
        </TouchableOpacity>
        <View style={dnaStyles.track}>
          <View
            style={[
              dnaStyles.fill,
              {
                width: `${Math.min(value, 100)}%`,
                backgroundColor: barColor,
              },
            ]}
          />
        </View>
        <TouchableOpacity
          style={dnaStyles.button}
          onPress={onIncrease}
          activeOpacity={0.7}
        >
          <Text style={dnaStyles.buttonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const dnaStyles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
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
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 18,
    color: colors.textPrimary,
  },
  track: {
    flex: 1,
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

export default function EditProfileScreen({ navigation }: Props) {
  const { session: authSession } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [belt, setBelt] = useState<Belt>("white");
  const [stripes, setStripes] = useState(0);
  const [weightClass, setWeightClass] = useState<string | null>(null);
  const [gi, setGi] = useState(true);
  const [nogi, setNogi] = useState(true);
  const [bio, setBio] = useState("");
  const [trainingGoals, setTrainingGoals] = useState("");
  const [dnaGuard, setDnaGuard] = useState(50);
  const [dnaPassing, setDnaPassing] = useState(50);
  const [dnaSubmissions, setDnaSubmissions] = useState(50);
  const [dnaTakedowns, setDnaTakedowns] = useState(50);
  const [dnaEscapes, setDnaEscapes] = useState(50);

  const fetchProfile = useCallback(async () => {
    if (!authSession?.user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authSession.user.id)
      .single();

    if (data) {
      const p = data as Profile;
      setName(p.name || "");
      setBelt(p.belt);
      setStripes(p.stripes);
      setWeightClass(p.weight_class);
      setGi(p.gi);
      setNogi(p.nogi);
      setBio(p.bio || "");
      setTrainingGoals(p.training_goals || "");
      setDnaGuard(p.dna_guard);
      setDnaPassing(p.dna_passing);
      setDnaSubmissions(p.dna_submissions);
      setDnaTakedowns(p.dna_takedowns);
      setDnaEscapes(p.dna_escapes);
    }

    setLoading(false);
  }, [authSession?.user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const clamp = (val: number) => Math.max(0, Math.min(100, val));

  const handleSave = async () => {
    if (!authSession?.user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        name: name.trim() || null,
        belt,
        stripes,
        weight_class: weightClass,
        gi,
        nogi,
        bio: bio.trim() || null,
        training_goals: trainingGoals.trim() || null,
        dna_guard: dnaGuard,
        dna_passing: dnaPassing,
        dna_submissions: dnaSubmissions,
        dna_takedowns: dnaTakedowns,
        dna_escapes: dnaEscapes,
      })
      .eq("id", authSession.user.id);

    setSaving(false);

    if (error) {
      Alert.alert("Error", "Could not save profile. Please try again.");
      return;
    }

    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

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
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Name */}
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            maxLength={50}
            autoCapitalize="words"
          />

          {/* Bio */}
          <Text style={styles.fieldLabel}>Bio</Text>
          <TextInput
            style={styles.textAreaInput}
            placeholder="Tell us about your jiu-jitsu journey"
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            value={bio}
            onChangeText={setBio}
            maxLength={300}
          />

          {/* Training Goals */}
          <Text style={styles.fieldLabel}>Training Goals</Text>
          <TextInput
            style={styles.textAreaInput}
            placeholder="What are you working towards?"
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            value={trainingGoals}
            onChangeText={setTrainingGoals}
            maxLength={300}
          />

          {/* Belt */}
          <Text style={styles.fieldLabel}>Belt</Text>
          <ChipSelector
            options={BELTS.map((b) => b.key)}
            selected={belt}
            onSelect={setBelt}
            renderLabel={(key) => BELTS.find((b) => b.key === key)!.label}
            renderDot={(key) => BELTS.find((b) => b.key === key)!.color}
          />

          {/* Stripes */}
          <Text style={styles.fieldLabel}>Stripes</Text>
          <ChipSelector
            options={STRIPE_OPTIONS}
            selected={stripes}
            onSelect={setStripes}
            renderLabel={(val) => String(val)}
          />

          {/* Weight Class */}
          <Text style={styles.fieldLabel}>Weight Class</Text>
          <ChipSelector
            options={WEIGHT_CLASSES}
            selected={weightClass || ""}
            onSelect={(val) => setWeightClass(val || null)}
            renderLabel={(val) => val || "None"}
          />

          {/* Training Preferences */}
          <Text style={styles.fieldLabel}>Training Style</Text>
          <View style={styles.toggleCard}>
            <ToggleRow label="Gi" value={gi} onToggle={() => setGi(!gi)} />
            <ToggleRow
              label="No-Gi"
              value={nogi}
              onToggle={() => setNogi(!nogi)}
            />
          </View>

          {/* Game DNA */}
          <Text style={styles.fieldLabel}>Game DNA</Text>
          <View style={styles.dnaCard}>
            <DnaSlider
              label="Guard"
              value={dnaGuard}
              onDecrease={() => setDnaGuard(clamp(dnaGuard - 5))}
              onIncrease={() => setDnaGuard(clamp(dnaGuard + 5))}
            />
            <DnaSlider
              label="Passing"
              value={dnaPassing}
              onDecrease={() => setDnaPassing(clamp(dnaPassing - 5))}
              onIncrease={() => setDnaPassing(clamp(dnaPassing + 5))}
            />
            <DnaSlider
              label="Submissions"
              value={dnaSubmissions}
              onDecrease={() => setDnaSubmissions(clamp(dnaSubmissions - 5))}
              onIncrease={() => setDnaSubmissions(clamp(dnaSubmissions + 5))}
            />
            <DnaSlider
              label="Takedowns"
              value={dnaTakedowns}
              onDecrease={() => setDnaTakedowns(clamp(dnaTakedowns - 5))}
              onIncrease={() => setDnaTakedowns(clamp(dnaTakedowns + 5))}
            />
            <DnaSlider
              label="Escapes"
              value={dnaEscapes}
              onDecrease={() => setDnaEscapes(clamp(dnaEscapes - 5))}
              onIncrease={() => setDnaEscapes(clamp(dnaEscapes + 5))}
            />
          </View>

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
              <Text style={styles.saveButtonText}>Save Profile</Text>
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
  textAreaInput: {
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
    marginBottom: 24,
  },
  toggleCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  dnaCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
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
