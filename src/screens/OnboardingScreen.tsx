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
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { supabase } from "../lib/supabase";
import {
  registerForPushNotifications,
  scheduleTrainingReminder,
  scheduleStreakAlert,
} from "../lib/notifications";
import type { Belt } from "../types";

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

const GOAL_OPTIONS = [
  "Compete",
  "Fitness",
  "Self Defence",
  "The Art",
  "Belt Milestones",
  "Technique",
];

const TOTAL_STEPS = 7;

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
              <View style={[chipStyles.dot, { backgroundColor: dot }]} />
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

// --- Multi Chip Selector ---

function MultiChipSelector({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
}) {
  return (
    <View style={chipStyles.row}>
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <TouchableOpacity
            key={opt}
            style={[chipStyles.chip, active && chipStyles.chipActive]}
            onPress={() => onToggle(opt)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                chipStyles.chipText,
                active && chipStyles.chipTextActive,
              ]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

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

function DnaSlider({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: number;
  onValueChange: (val: number) => void;
}) {
  return (
    <View style={dnaStyles.container}>
      <View style={dnaStyles.header}>
        <Text style={dnaStyles.label}>{label}</Text>
        <Text style={dnaStyles.value}>{Math.round(value)}</Text>
      </View>
      <Slider
        style={dnaStyles.slider}
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.surfaceRaised}
        thumbTintColor={colors.textPrimary}
      />
    </View>
  );
}

const dnaStyles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: colors.textPrimary,
  },
  value: {
    fontFamily: "DMSans_700Bold",
    fontSize: 15,
    color: colors.gold,
  },
  slider: {
    width: "100%",
    height: 40,
  },
});

// --- Progress Bar ---

function ProgressBar({ step }: { step: number }) {
  const progress = ((step + 1) / TOTAL_STEPS) * 100;
  return (
    <View style={progressStyles.track}>
      <View style={[progressStyles.fill, { width: `${progress}%` }]} />
    </View>
  );
}

const progressStyles = StyleSheet.create({
  track: {
    height: 4,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 2,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
  },
  fill: {
    height: 4,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
});

// --- Main Screen ---

type Props = {
  userId: string;
  onComplete: () => void;
};

export default function OnboardingScreen({ userId, onComplete }: Props) {
  const [step, setStep] = useState(0);

  // Step 0: Welcome
  const [name, setName] = useState("");

  // Step 1: Belt
  const [belt, setBelt] = useState<Belt>("white");
  const [stripes, setStripes] = useState(0);

  // Step 2: Gym
  const [gymCode, setGymCode] = useState("");
  const [gymName, setGymName] = useState("");
  const [gymId, setGymId] = useState<string | null>(null);
  const [gymCoachId, setGymCoachId] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [gymVerified, setGymVerified] = useState(false);

  // Step 3: Weight & Format
  const [unitSystem, setUnitSystem] = useState("metric");
  const [weightClass, setWeightClass] = useState<string | null>(null);
  const [gi, setGi] = useState(true);
  const [nogi, setNogi] = useState(true);

  // Step 4: Goals
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  // Step 5: DNA
  const [dnaGuard, setDnaGuard] = useState(50);
  const [dnaPassing, setDnaPassing] = useState(50);
  const [dnaSubmissions, setDnaSubmissions] = useState(50);
  const [dnaTakedowns, setDnaTakedowns] = useState(50);
  const [dnaEscapes, setDnaEscapes] = useState(50);

  // Step 6: Saving
  const [saving, setSaving] = useState(false);

  const handleVerifyGym = async () => {
    const trimmed = gymCode.trim();
    if (!trimmed) return;

    setVerifying(true);

    const { data: gym } = await supabase
      .from("gyms")
      .select("id, name, coach_id")
      .eq("code", trimmed)
      .single();

    setVerifying(false);

    if (gym) {
      setGymId(gym.id);
      setGymName(gym.name);
      setGymCoachId(gym.coach_id);
      setGymVerified(true);
    } else {
      Alert.alert("Not found", "No gym found with that code. Check with your coach.");
      setGymVerified(false);
      setGymId(null);
      setGymCoachId(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    // Request notification permissions and get push token
    const pushToken = await registerForPushNotifications();

    const { error } = await supabase
      .from("profiles")
      .update({
        name: name.trim(),
        belt,
        stripes,
        gym_id: gymId,
        coach_id: gymCoachId,
        weight_class: weightClass,
        gi,
        nogi,
        unit_system: unitSystem,
        training_goals: selectedGoals.length > 0 ? selectedGoals.join(", ") : null,
        dna_guard: dnaGuard,
        dna_passing: dnaPassing,
        dna_submissions: dnaSubmissions,
        dna_takedowns: dnaTakedowns,
        dna_escapes: dnaEscapes,
        push_token: pushToken,
      })
      .eq("id", userId);

    setSaving(false);

    if (error) {
      Alert.alert("Error", "Could not save profile. Please try again.");
      return;
    }

    // Schedule default notifications (runs in background, no need to await)
    scheduleTrainingReminder(7, 0);
    scheduleStreakAlert();

    onComplete();
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const canContinue = (): boolean => {
    switch (step) {
      case 0:
        return name.trim().length > 0;
      default:
        return true;
    }
  };

  const handleContinue = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <View>
            <Text style={styles.stepTitle}>Welcome to Diary of a Grappler</Text>
            <Text style={styles.stepSubtitle}>Let's set up your profile</Text>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              maxLength={50}
              autoCapitalize="words"
              autoFocus
            />
          </View>
        );

      case 1:
        return (
          <View>
            <Text style={styles.stepTitle}>What's your belt rank?</Text>
            <Text style={styles.fieldLabel}>Belt</Text>
            <ChipSelector
              options={BELTS.map((b) => b.key)}
              selected={belt}
              onSelect={setBelt}
              renderLabel={(key) => BELTS.find((b) => b.key === key)!.label}
              renderDot={(key) => BELTS.find((b) => b.key === key)!.color}
            />
            <Text style={styles.fieldLabel}>Stripes</Text>
            <ChipSelector
              options={STRIPE_OPTIONS}
              selected={stripes}
              onSelect={setStripes}
              renderLabel={(val) => String(val)}
            />
          </View>
        );

      case 2:
        return (
          <View>
            <Text style={styles.stepTitle}>Connect to your gym</Text>
            <Text style={styles.stepSubtitle}>
              Enter a gym code from your coach, or skip this step for now.
            </Text>
            <Text style={styles.fieldLabel}>Gym Code</Text>
            <View style={styles.codeRow}>
              <TextInput
                style={styles.codeInput}
                placeholder="e.g. BJJ-ACADEMY-2024"
                placeholderTextColor={colors.textMuted}
                value={gymCode}
                onChangeText={(text) => {
                  setGymCode(text);
                  if (gymVerified) {
                    setGymVerified(false);
                    setGymId(null);
                    setGymCoachId(null);
                    setGymName("");
                  }
                }}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={30}
              />
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  (!gymCode.trim() || verifying) && styles.verifyButtonDisabled,
                ]}
                onPress={handleVerifyGym}
                disabled={!gymCode.trim() || verifying}
                activeOpacity={0.7}
              >
                {verifying ? (
                  <ActivityIndicator color={colors.textPrimary} size="small" />
                ) : (
                  <Text style={styles.verifyButtonText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
            {gymVerified && (
              <View style={styles.gymConfirmed}>
                <Ionicons name="checkmark-circle" size={20} color={colors.green} />
                <Text style={styles.gymConfirmedText}>{gymName}</Text>
              </View>
            )}
          </View>
        );

      case 3:
        return (
          <View>
            <Text style={styles.stepTitle}>Training preferences</Text>
            <Text style={styles.fieldLabel}>Unit System</Text>
            <ChipSelector
              options={["metric", "imperial"]}
              selected={unitSystem}
              onSelect={setUnitSystem}
              renderLabel={(val) =>
                val === "metric" ? "Metric (kg)" : "Imperial (lbs)"
              }
            />
            <Text style={styles.fieldLabel}>Weight Class</Text>
            <ChipSelector
              options={WEIGHT_CLASSES}
              selected={weightClass || ""}
              onSelect={(val) => setWeightClass(val || null)}
              renderLabel={(val) => val || "None"}
            />
            <Text style={styles.fieldLabel}>Training Style</Text>
            <View style={styles.toggleCard}>
              <ToggleRow label="Gi" value={gi} onToggle={() => setGi(!gi)} />
              <ToggleRow
                label="No-Gi"
                value={nogi}
                onToggle={() => setNogi(!nogi)}
              />
            </View>
          </View>
        );

      case 4:
        return (
          <View>
            <Text style={styles.stepTitle}>What are your goals?</Text>
            <Text style={styles.stepSubtitle}>Select all that apply</Text>
            <MultiChipSelector
              options={GOAL_OPTIONS}
              selected={selectedGoals}
              onToggle={toggleGoal}
            />
          </View>
        );

      case 5:
        return (
          <View>
            <Text style={styles.stepTitle}>Rate your game</Text>
            <Text style={styles.stepSubtitle}>You can change this later</Text>
            <DnaSlider label="Guard" value={dnaGuard} onValueChange={setDnaGuard} />
            <DnaSlider label="Passing" value={dnaPassing} onValueChange={setDnaPassing} />
            <DnaSlider label="Submissions" value={dnaSubmissions} onValueChange={setDnaSubmissions} />
            <DnaSlider label="Takedowns" value={dnaTakedowns} onValueChange={setDnaTakedowns} />
            <DnaSlider label="Escapes" value={dnaEscapes} onValueChange={setDnaEscapes} />
          </View>
        );

      case 6:
        return (
          <View style={styles.completionContainer}>
            <Ionicons name="checkmark-circle" size={64} color={colors.green} />
            <Text style={styles.completionTitle}>You're all set!</Text>
            <Text style={styles.completionSubtitle}>Time to hit the mats.</Text>
            <TouchableOpacity
              style={[styles.getStartedButton, saving && styles.getStartedButtonDisabled]}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.textPrimary} />
              ) : (
                <Text style={styles.getStartedButtonText}>Get Started</Text>
              )}
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  const showBack = step > 0 && step < 6;
  const showContinue = step < 6;
  const continueLabel = step === 2 && !gymVerified ? "Skip" : "Continue";

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <ProgressBar step={step} />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {renderStepContent()}
          </ScrollView>
        </KeyboardAvoidingView>
        {(showBack || showContinue) && (
          <View style={styles.bottomBar}>
            {showBack ? (
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                activeOpacity={0.7}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.backSpacer} />
            )}
            {showContinue && (
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  !canContinue() && styles.continueButtonDisabled,
                ]}
                onPress={handleContinue}
                activeOpacity={0.8}
                disabled={!canContinue()}
              >
                <Text style={styles.continueButtonText}>{continueLabel}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
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
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Step content
  stepTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 26,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
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

  // Gym step
  codeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  codeInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  verifyButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 14,
    color: colors.textPrimary,
  },
  gymConfirmed: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.green,
  },
  gymConfirmedText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: colors.green,
  },

  // Toggle card
  toggleCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },

  // Completion step
  completionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  completionTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 28,
    color: colors.textPrimary,
    marginTop: 20,
    marginBottom: 8,
  },
  completionSubtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 40,
  },
  getStartedButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: "center",
  },
  getStartedButtonDisabled: {
    opacity: 0.6,
  },
  getStartedButtonText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: colors.textPrimary,
  },

  // Bottom bar
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  backButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  backButtonText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 16,
    color: colors.textSecondary,
  },
  backSpacer: {
    width: 80,
  },
  continueButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueButtonText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: colors.textPrimary,
  },
});
