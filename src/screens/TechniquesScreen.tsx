import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import type { Technique, Difficulty } from "../types";
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
  searchBg: "#11111A",
};

// --- Helpers ---

const CATEGORY_ICONS: Record<string, string> = {
  Guard: "\u{1F6E1}\u{FE0F}",
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

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  beginner: "#2D8E4E",
  intermediate: "#C9A84C",
  advanced: "#C41E3A",
};

function difficultyLabel(d: Difficulty): string {
  return d.charAt(0).toUpperCase() + d.slice(1);
}

type TechniquesNav = NativeStackNavigationProp<
  TechniquesStackParamList,
  "TechniquesHome"
>;

// --- Filter Chip ---

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[filterStyles.chip, active && filterStyles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[filterStyles.text, active && filterStyles.textActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const filterStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.gold,
  },
  text: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: colors.textSecondary,
  },
  textActive: {
    color: colors.gold,
  },
});

// --- Technique Card ---

function TechniqueCard({
  technique,
  onPress,
}: {
  technique: Technique;
  onPress: () => void;
}) {
  const diffColor = DIFFICULTY_COLORS[technique.difficulty] || colors.textMuted;

  return (
    <TouchableOpacity
      style={cardStyles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={cardStyles.header}>
        <Text style={cardStyles.icon}>
          {categoryIcon(technique.category)}
        </Text>
        <View style={cardStyles.headerText}>
          <Text style={cardStyles.name}>{technique.name}</Text>
          {technique.subcategory && (
            <Text style={cardStyles.subcategory}>{technique.subcategory}</Text>
          )}
        </View>
        <View style={[cardStyles.diffBadge, { backgroundColor: diffColor + "20" }]}>
          <Text style={[cardStyles.diffText, { color: diffColor }]}>
            {difficultyLabel(technique.difficulty)}
          </Text>
        </View>
      </View>
      {technique.description && (
        <Text style={cardStyles.description} numberOfLines={2}>
          {technique.description}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: colors.textPrimary,
  },
  subcategory: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  diffBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  diffText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 11,
  },
  description: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 10,
    lineHeight: 19,
  },
});

// --- Empty State ---

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <View style={emptyStyles.container}>
      <Text style={emptyStyles.icon}>{"\u{1F50D}"}</Text>
      <Text style={emptyStyles.title}>
        {hasFilters ? "No matches" : "No techniques yet"}
      </Text>
      <Text style={emptyStyles.subtitle}>
        {hasFilters
          ? "Try adjusting your filters or search term."
          : "The technique library is empty. Techniques will appear here once added."}
      </Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontFamily: "DMSans_700Bold",
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});

// --- Main Screen ---

interface SectionData {
  title: string;
  data: Technique[];
}

export default function TechniquesScreen() {
  const navigation = useNavigation<TechniquesNav>();
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty | null>(
    null
  );

  const fetchTechniques = useCallback(async () => {
    const { data } = await supabase
      .from("techniques")
      .select("*")
      .order("category")
      .order("name");

    if (data) setTechniques(data as Technique[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTechniques();
  }, [fetchTechniques]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTechniques();
    setRefreshing(false);
  }, [fetchTechniques]);

  // Derive categories from data
  const categories = useMemo(() => {
    const cats = [...new Set(techniques.map((t) => t.category))];
    return cats.sort();
  }, [techniques]);

  // Filter
  const filtered = useMemo(() => {
    let result = techniques;

    if (activeCategory) {
      result = result.filter((t) => t.category === activeCategory);
    }
    if (activeDifficulty) {
      result = result.filter((t) => t.difficulty === activeDifficulty);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (t.subcategory && t.subcategory.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    return result;
  }, [techniques, activeCategory, activeDifficulty, search]);

  // Group into sections by category
  const sections: SectionData[] = useMemo(() => {
    const map = new Map<string, Technique[]>();
    for (const t of filtered) {
      const list = map.get(t.category) || [];
      list.push(t);
      map.set(t.category, list);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([title, data]) => ({ title, data }));
  }, [filtered]);

  const hasFilters = !!(search.trim() || activeCategory || activeDifficulty);

  const toggleCategory = (cat: string) => {
    setActiveCategory((prev) => (prev === cat ? null : cat));
  };

  const toggleDifficulty = (diff: Difficulty) => {
    setActiveDifficulty((prev) => (prev === diff ? null : diff));
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
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Techniques</Text>
              <Text style={styles.headerCount}>
                {filtered.length} technique{filtered.length !== 1 ? "s" : ""}
              </Text>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>{"\u{1F50D}"}</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search techniques..."
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Text style={styles.clearButton}>{"\u{2715}"}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Category Filters */}
            {categories.length > 0 && (
              <View style={styles.filterRow}>
                {categories.map((cat) => (
                  <FilterChip
                    key={cat}
                    label={cat}
                    active={activeCategory === cat}
                    onPress={() => toggleCategory(cat)}
                  />
                ))}
              </View>
            )}

            {/* Difficulty Filters */}
            <View style={styles.filterRow}>
              {(["beginner", "intermediate", "advanced"] as Difficulty[]).map(
                (diff) => (
                  <FilterChip
                    key={diff}
                    label={difficultyLabel(diff)}
                    active={activeDifficulty === diff}
                    onPress={() => toggleDifficulty(diff)}
                  />
                )
              )}
            </View>
          </>
        }
        renderSectionHeader={({ section: { title, data } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>{categoryIcon(title)}</Text>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionCount}>{data.length}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TechniqueCard
            technique={item}
            onPress={() =>
              navigation.navigate("TechniqueDetail", { technique: item })
            }
          />
        )}
        ListEmptyComponent={<EmptyState hasFilters={hasFilters} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  // Header
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  headerTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 26,
    color: colors.textPrimary,
  },
  headerCount: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textMuted,
  },

  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.searchBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 12,
  },
  clearButton: {
    fontSize: 14,
    color: colors.textMuted,
    paddingLeft: 8,
  },

  // Filters
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },

  // Section headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 12,
    paddingBottom: 10,
  },
  sectionIcon: {
    fontSize: 16,
  },
  sectionTitle: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    flex: 1,
  },
  sectionCount: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: colors.textMuted,
  },
});
