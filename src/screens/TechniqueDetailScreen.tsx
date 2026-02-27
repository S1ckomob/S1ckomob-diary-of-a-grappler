import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { Difficulty } from "../types";
import type { TechniquesStackParamList } from "../navigation";

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

// --- Types ---

type Props = NativeStackScreenProps<TechniquesStackParamList, "TechniqueDetail">;

// --- Info Row ---

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textSecondary,
  },
  value: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: colors.textPrimary,
  },
});

// --- Main Screen ---

export default function TechniqueDetailScreen({ navigation, route }: Props) {
  const { technique } = route.params;
  const diffColor =
    DIFFICULTY_COLORS[technique.difficulty] || colors.textMuted;

  const handleVideoPress = () => {
    if (technique.video_url) {
      Linking.openURL(technique.video_url);
    }
  };

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
            <Text style={styles.backText}>{"\u{2190}"} Back</Text>
          </TouchableOpacity>
        </View>

        {/* Title area */}
        <View style={styles.titleArea}>
          <Text style={styles.categoryIcon}>
            {categoryIcon(technique.category)}
          </Text>
          <Text style={styles.name}>{technique.name}</Text>
          <View style={styles.metaRow}>
            <View
              style={[
                styles.diffBadge,
                { backgroundColor: hexToRgba(diffColor, 0.15) },
              ]}
            >
              <Text style={[styles.diffText, { color: diffColor }]}>
                {difficultyLabel(technique.difficulty)}
              </Text>
            </View>
            {technique.is_beginner && (
              <View style={styles.beginnerBadge}>
                <Text style={styles.beginnerText}>Beginner Friendly</Text>
              </View>
            )}
          </View>
        </View>

        {/* Details card */}
        <View style={styles.detailCard}>
          <InfoRow label="Category" value={technique.category} />
          {technique.subcategory && (
            <InfoRow label="Subcategory" value={technique.subcategory} />
          )}
          <InfoRow
            label="Difficulty"
            value={difficultyLabel(technique.difficulty)}
          />
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

        {/* Video link */}
        {technique.video_url && (
          <TouchableOpacity
            style={styles.videoButton}
            onPress={handleVideoPress}
            activeOpacity={0.8}
          >
            <Text style={styles.videoIcon}>{"\u{25B6}\u{FE0F}"}</Text>
            <Text style={styles.videoText}>Watch Video</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    paddingTop: 60,
    paddingBottom: 8,
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
  categoryIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  name: {
    fontFamily: "DMSans_700Bold",
    fontSize: 24,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
  },
  diffBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  diffText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
  },
  beginnerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  beginnerText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Detail card
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
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
  descriptionCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  descriptionText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
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
  },
  videoIcon: {
    fontSize: 16,
  },
  videoText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: colors.textPrimary,
  },
});
