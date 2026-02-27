import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import { useSession } from "../hooks/useSession";
import type { Technique, Difficulty, TechniqueNote } from "../types";
import type { TechniquesStackParamList } from "../navigation";

// --- Theme (prototype-exact) ---

const colors = {
  background: "#08080D",
  card: "#1A1A26",
  cardBorder: "rgba(255,255,255,0.07)",
  accent: "#C41E3A",
  accentBg: "rgba(196,30,58,0.15)",
  accentBorder: "rgba(196,30,58,0.3)",
  gold: "#C9A84C",
  green: "#2ECC71",
  textWarm: "#F0EFE9",
  textBody: "#B8B5A8",
  textMuted: "#6B6860",
  textDim: "#4A4740",
};

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  beginner: "#2ECC71",
  intermediate: "#C9A84C",
  advanced: "#C41E3A",
};

const CATEGORY_COLORS: Record<string, string> = {
  Guard: "#3B82F6",
  Passes: "#F59E0B",
  Passing: "#F59E0B",
  Submissions: "#EF4444",
  Takedowns: "#8B5CF6",
  Escapes: "#10B981",
  Sweeps: "#06B6D4",
  Pins: "#F97316",
  Transitions: "#EC4899",
};

const CATEGORY_ICONS: Record<string, string> = {
  Guard: "shield-outline",
  Passes: "arrow-forward-outline",
  Passing: "arrow-forward-outline",
  Submissions: "flash-outline",
  Takedowns: "trending-down-outline",
  Escapes: "exit-outline",
  Sweeps: "swap-vertical-outline",
  Pins: "lock-closed-outline",
  Transitions: "repeat-outline",
};

const serifFont = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "Georgia, serif",
});

function difficultyLabel(d: Difficulty): string {
  return d.charAt(0).toUpperCase() + d.slice(1);
}

// --- Types ---

type Props = NativeStackScreenProps<TechniquesStackParamList, "TechniqueDetail">;

// --- Main Screen ---

export default function TechniqueDetailScreen({ navigation, route }: Props) {
  const { technique: initialTechnique } = route.params;
  const { session } = useSession();

  // Re-fetch full technique from Supabase to get all columns (steps, key_details, etc.)
  const [technique, setTechnique] = useState<Technique>(initialTechnique);

  const fetchTechnique = useCallback(async () => {
    const { data } = await supabase
      .from("techniques")
      .select("*")
      .eq("id", initialTechnique.id)
      .single();

    if (data) setTechnique(data as Technique);
  }, [initialTechnique.id]);

  useEffect(() => {
    fetchTechnique();
  }, [fetchTechnique]);

  const diffColor =
    DIFFICULTY_COLORS[technique.difficulty] || colors.textMuted;
  const catColor = CATEGORY_COLORS[technique.category] || colors.textMuted;
  const catIcon = CATEGORY_ICONS[technique.category] || "help-outline";

  // Notes state
  const [notesText, setNotesText] = useState("");
  const [notesLoading, setNotesLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!session?.user?.id) {
      setNotesLoading(false);
      return;
    }
    const { data } = await supabase
      .from("technique_notes")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("technique_id", technique.id)
      .maybeSingle();

    if (data) {
      const note = data as TechniqueNote;
      setNotesText(note.notes || "");
    }
    setNotesLoading(false);
  }, [session?.user?.id, technique.id]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const saveNotes = async () => {
    if (!session?.user?.id) return;
    setSaving(true);

    await supabase.from("technique_notes").upsert(
      {
        user_id: session.user.id,
        technique_id: technique.id,
        notes: notesText.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,technique_id" }
    );

    setSaving(false);
  };

  const handleVideoPress = () => {
    if (technique.video_url) {
      Linking.openURL(technique.video_url);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
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
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </View>

          {/* Icon circle + Title */}
          <View style={styles.titleArea}>
            <View style={[styles.iconCircle, { backgroundColor: `${catColor}1A` }]}>
              <Ionicons
                name={catIcon as any}
                size={32}
                color={catColor}
              />
            </View>
            <Text style={styles.name}>{technique.name}</Text>

            {/* Badge row */}
            <View style={styles.badgeRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {technique.category}
                </Text>
              </View>
              <View
                style={[
                  styles.diffBadge,
                  { backgroundColor: `${diffColor}26` },
                ]}
              >
                <View
                  style={[styles.diffDot, { backgroundColor: diffColor }]}
                />
                <Text style={[styles.diffText, { color: diffColor }]}>
                  {difficultyLabel(technique.difficulty)}
                </Text>
              </View>
              {technique.is_beginner && (
                <View style={styles.beginnerBadge}>
                  <Ionicons name="star" size={10} color={colors.gold} />
                  <Text style={styles.beginnerText}>Beginner</Text>
                </View>
              )}
            </View>

            {/* Subcategory */}
            {technique.subcategory && (
              <Text style={styles.subcategory}>{technique.subcategory}</Text>
            )}
          </View>

          {/* Description */}
          {technique.description && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Description</Text>
              <View style={styles.descriptionCard}>
                <Text style={styles.descriptionText}>
                  {technique.description}
                </Text>
              </View>
            </View>
          )}

          {/* Positions From */}
          {technique.positions_from && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Positions From</Text>
              <View style={styles.contentCard}>
                <View style={styles.positionsRow}>
                  {technique.positions_from.split(",").map((pos, i) => (
                    <View key={i} style={styles.positionPill}>
                      <Ionicons name="navigate-outline" size={11} color={colors.textBody} />
                      <Text style={styles.positionText}>{pos.trim()}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Steps */}
          {technique.steps && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Steps</Text>
              <View style={styles.contentCard}>
                {technique.steps.split("\n").map((step, i) => (
                  <View key={i} style={styles.stepRow}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step.replace(/^\d+\.\s*/, "")}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Key Details */}
          {technique.key_details && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Key Details</Text>
              <View style={styles.contentCard}>
                {technique.key_details.split("\n").map((detail, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.green} />
                    <Text style={styles.bulletText}>{detail.replace(/^[-•]\s*/, "")}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Common Mistakes */}
          {technique.common_mistakes && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Common Mistakes</Text>
              <View style={[styles.contentCard, styles.mistakesCard]}>
                {technique.common_mistakes.split("\n").map((mistake, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <Ionicons name="alert-circle" size={14} color={colors.accent} />
                    <Text style={styles.bulletText}>{mistake.replace(/^[-•]\s*/, "")}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Video link */}
          {technique.video_url && (
            <TouchableOpacity
              style={styles.videoButton}
              onPress={handleVideoPress}
              activeOpacity={0.8}
            >
              <Ionicons
                name="play-circle"
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.videoText}>Watch Video</Text>
            </TouchableOpacity>
          )}

          {/* Personal Notes */}
          {session?.user && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Your Notes</Text>
              {notesLoading ? (
                <ActivityIndicator
                  size="small"
                  color={colors.accent}
                  style={styles.notesLoader}
                />
              ) : (
                <>
                  <View style={styles.notesCard}>
                    <TextInput
                      style={styles.notesInput}
                      placeholder="Add personal notes, drills, or key details..."
                      placeholderTextColor={colors.textDim}
                      value={notesText}
                      onChangeText={setNotesText}
                      multiline
                      textAlignVertical="top"
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={saveNotes}
                    activeOpacity={0.8}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.saveButtonText}>Save Notes</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
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
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: colors.textMuted,
  },

  // Title area
  titleArea: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  name: {
    fontFamily: serifFont,
    fontSize: 26,
    color: colors.textWarm,
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "700",
    lineHeight: 34,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: colors.accentBg,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 11,
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  diffBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  diffDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  diffText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 11,
  },
  beginnerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(201,168,76,0.15)",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.3)",
  },
  beginnerText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 11,
    color: colors.gold,
  },
  subcategory: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 12,
    letterSpacing: 0.3,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 10,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  descriptionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  descriptionText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textBody,
    lineHeight: 24,
  },

  // Content cards (steps, key details, mistakes, positions)
  contentCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  mistakesCard: {
    borderColor: "rgba(196,30,58,0.15)",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepNumberText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 11,
    color: colors.textBody,
  },
  stepText: {
    flex: 1,
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textBody,
    lineHeight: 22,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
  },
  bulletText: {
    flex: 1,
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textBody,
    lineHeight: 22,
  },
  positionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  positionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  positionText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    color: colors.textBody,
  },

  // Video
  videoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 24,
  },
  videoText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 14,
    color: "#FFFFFF",
  },

  // Notes
  notesLoader: {
    paddingVertical: 20,
  },
  notesCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 12,
  },
  notesInput: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textWarm,
    minHeight: 120,
    lineHeight: 22,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 14,
    color: "#FFFFFF",
  },
});
