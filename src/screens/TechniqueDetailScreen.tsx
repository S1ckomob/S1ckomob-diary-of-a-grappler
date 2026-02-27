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
import type { Difficulty, TechniqueNote } from "../types";
import type { TechniquesStackParamList } from "../navigation";

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

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  beginner: "#2D8E4E",
  intermediate: "#C9A84C",
  advanced: "#C41E3A",
};

const CATEGORY_ICONS: Record<string, string> = {
  Guard: "\u{1F6E1}\u{FE0F}",
  Passes: "\u{1F3C3}",
  Passing: "\u{1F3C3}",
  Submissions: "\u{1F4A5}",
  Takedowns: "\u{1F93C}",
  Escapes: "\u{1F6AA}",
  Sweeps: "\u{1F300}",
  Pins: "\u{1F4CC}",
  Transitions: "\u{1F504}",
};

function categoryIcon(category: string): string {
  return CATEGORY_ICONS[category] || "\u{1F94B}";
}

function difficultyLabel(d: Difficulty): string {
  return d.charAt(0).toUpperCase() + d.slice(1);
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const serifFont = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "serif",
});

// --- Types ---

type Props = NativeStackScreenProps<TechniquesStackParamList, "TechniqueDetail">;

// --- Main Screen ---

export default function TechniqueDetailScreen({ navigation, route }: Props) {
  const { technique } = route.params;
  const { session } = useSession();
  const diffColor =
    DIFFICULTY_COLORS[technique.difficulty] || colors.textMuted;

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
              <Ionicons
                name="arrow-back"
                size={20}
                color={colors.textSecondary}
              />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </View>

          {/* Title area */}
          <View style={styles.titleArea}>
            <Text style={styles.categoryEmoji}>
              {categoryIcon(technique.category)}
            </Text>
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
                  { backgroundColor: hexToRgba(diffColor, 0.15) },
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
                  <Ionicons
                    name="leaf-outline"
                    size={12}
                    color={colors.green}
                  />
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
              <Text style={styles.descriptionText}>
                {technique.description}
              </Text>
            </View>
          )}

          {/* Video link */}
          {technique.video_url && (
            <TouchableOpacity
              style={styles.videoButton}
              onPress={handleVideoPress}
              activeOpacity={0.8}
            >
              <Ionicons name="play-circle" size={20} color={colors.textPrimary} />
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
                      placeholder="Add personal notes about this technique..."
                      placeholderTextColor={colors.textMuted}
                      value={notesText}
                      onChangeText={setNotesText}
                      multiline
                      textAlignVertical="top"
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={saveNotes}
                    activeOpacity={0.8}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color={colors.textPrimary} />
                    ) : (
                      <>
                        <Ionicons
                          name="save-outline"
                          size={16}
                          color={colors.textPrimary}
                        />
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
    gap: 6,
  },
  backText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 16,
    color: colors.textSecondary,
  },

  // Title
  titleArea: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 28,
  },
  categoryEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  name: {
    fontFamily: serifFont,
    fontSize: 28,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "700",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: hexToRgba(colors.accent, 0.15),
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  categoryBadgeText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: colors.accent,
  },
  diffBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  diffDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  diffText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
  },
  beginnerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: hexToRgba(colors.green, 0.15),
  },
  beginnerText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: colors.green,
  },
  subcategory: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 10,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  descriptionText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 26,
  },

  // Video
  videoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 24,
  },
  videoText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: colors.textPrimary,
  },

  // Notes
  notesLoader: {
    paddingVertical: 20,
  },
  notesCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  notesInput: {
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 100,
    lineHeight: 22,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButtonText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: colors.textPrimary,
  },
});
