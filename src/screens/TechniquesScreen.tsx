import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
  green: "#2D8E4E",
  textPrimary: "#FFFFFF",
  textSecondary: "#9A9AA0",
  textMuted: "#5A5A64",
  border: "#1E1E2A",
};

// --- Helpers ---

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  beginner: "#2D8E4E",
  intermediate: "#C9A84C",
  advanced: "#C41E3A",
};

const CATEGORIES = [
  "Guard",
  "Passes",
  "Submissions",
  "Takedowns",
  "Escapes",
  "Sweeps",
  "Transitions",
];

function difficultyLabel(d: Difficulty): string {
  return d.charAt(0).toUpperCase() + d.slice(1);
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type TechniquesNav = NativeStackNavigationProp<
  TechniquesStackParamList,
  "TechniquesHome"
>;

// --- Category Pill ---

function CategoryPill({
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
      style={[pillStyles.pill, active && pillStyles.pillActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[pillStyles.text, active && pillStyles.textActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: hexToRgba(colors.accent, 0.15),
    borderColor: colors.accent,
  },
  text: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: colors.textSecondary,
  },
  textActive: {
    color: colors.accent,
  },
});

// --- Difficulty Filter Chip ---

function DifficultyChip({
  label,
  color,
  active,
  onPress,
}: {
  label: string;
  color: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        chipStyles.chip,
        active && { backgroundColor: hexToRgba(color, 0.15), borderColor: color },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[chipStyles.dot, { backgroundColor: active ? color : colors.textMuted }]} />
      <Text
        style={[chipStyles.text, active && { color }]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: colors.textSecondary,
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
      <Text style={cardStyles.name}>{technique.name}</Text>
      <View style={cardStyles.badges}>
        <View style={cardStyles.categoryBadge}>
          <Text style={cardStyles.categoryText}>{technique.category}</Text>
        </View>
        <View
          style={[
            cardStyles.diffBadge,
            { backgroundColor: hexToRgba(diffColor, 0.15) },
          ]}
        >
          <View style={[cardStyles.diffDot, { backgroundColor: diffColor }]} />
          <Text style={[cardStyles.diffText, { color: diffColor }]}>
            {difficultyLabel(technique.difficulty)}
          </Text>
        </View>
        {technique.subcategory && (
          <View style={cardStyles.subcategoryBadge}>
            <Text style={cardStyles.subcategoryText}>
              {technique.subcategory}
            </Text>
          </View>
        )}
      </View>
      {technique.description ? (
        <Text style={cardStyles.description} numberOfLines={2}>
          {technique.description}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: hexToRgba(colors.accent, 0.15),
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  categoryText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    color: colors.accent,
  },
  subcategoryBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  subcategoryText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: colors.textMuted,
  },
  diffBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  diffDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  diffText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
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
      <Ionicons name="search-outline" size={48} color={colors.textMuted} />
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
  title: {
    fontFamily: "DMSans_700Bold",
    fontSize: 20,
    color: colors.textPrimary,
    marginTop: 16,
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
  const [beginnerOnly, setBeginnerOnly] = useState(false);

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

  // Filter
  const filtered = useMemo(() => {
    let result = techniques;

    if (activeCategory) {
      result = result.filter((t) => t.category === activeCategory);
    }
    if (activeDifficulty) {
      result = result.filter((t) => t.difficulty === activeDifficulty);
    }
    if (beginnerOnly) {
      result = result.filter((t) => t.is_beginner);
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
  }, [techniques, activeCategory, activeDifficulty, beginnerOnly, search]);

  const hasFilters = !!(
    search.trim() ||
    activeCategory ||
    activeDifficulty ||
    beginnerOnly
  );

  const toggleCategory = (cat: string) => {
    setActiveCategory((prev) => (prev === cat ? null : cat));
  };

  const toggleDifficulty = (diff: Difficulty) => {
    setActiveDifficulty((prev) => (prev === diff ? null : diff));
  };

  const renderItem = useCallback(
    ({ item }: { item: Technique }) => (
      <TechniqueCard
        technique={item}
        onPress={() =>
          navigation.navigate("TechniqueDetail", { technique: item })
        }
      />
    ),
    [navigation]
  );

  const keyExtractor = useCallback((item: Technique) => item.id, []);

  const ListHeader = (
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
        <Ionicons
          name="search-outline"
          size={18}
          color={colors.textMuted}
          style={styles.searchIcon}
        />
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
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Pills - horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryScrollContent}
      >
        <CategoryPill
          label="All"
          active={activeCategory === null}
          onPress={() => setActiveCategory(null)}
        />
        {CATEGORIES.map((cat) => (
          <CategoryPill
            key={cat}
            label={cat}
            active={activeCategory === cat}
            onPress={() => toggleCategory(cat)}
          />
        ))}
      </ScrollView>

      {/* Difficulty Filters + Beginner Toggle */}
      <View style={styles.filterRow}>
        {(["beginner", "intermediate", "advanced"] as Difficulty[]).map(
          (diff) => (
            <DifficultyChip
              key={diff}
              label={difficultyLabel(diff)}
              color={DIFFICULTY_COLORS[diff]}
              active={activeDifficulty === diff}
              onPress={() => toggleDifficulty(diff)}
            />
          )
        )}
        <TouchableOpacity
          style={[
            styles.beginnerToggle,
            beginnerOnly && styles.beginnerToggleActive,
          ]}
          onPress={() => setBeginnerOnly((prev) => !prev)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="leaf-outline"
            size={14}
            color={beginnerOnly ? colors.green : colors.textMuted}
          />
          <Text
            style={[
              styles.beginnerToggleText,
              beginnerOnly && styles.beginnerToggleTextActive,
            ]}
          >
            Beginner
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        ListHeaderComponent={ListHeader}
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 12,
  },

  // Category scroll
  categoryScroll: {
    marginHorizontal: -20,
    marginBottom: 12,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
  },

  // Filters
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },

  // Beginner toggle
  beginnerToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  beginnerToggleActive: {
    backgroundColor: hexToRgba(colors.green, 0.15),
    borderColor: colors.green,
  },
  beginnerToggleText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: colors.textMuted,
  },
  beginnerToggleTextActive: {
    color: colors.green,
  },
});
