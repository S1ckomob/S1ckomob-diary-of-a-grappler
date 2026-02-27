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
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import type { Technique, Difficulty } from "../types";
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
  goldBg: "rgba(201,168,76,0.15)",
  goldBorder: "rgba(201,168,76,0.3)",
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
  Submissions: "#EF4444",
  Takedowns: "#8B5CF6",
  Escapes: "#10B981",
  Sweeps: "#06B6D4",
  Transitions: "#EC4899",
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

const serifFont = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "Georgia, serif",
});

function difficultyLabel(d: Difficulty): string {
  return d.charAt(0).toUpperCase() + d.slice(1);
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
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  text: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    color: colors.textMuted,
  },
  textActive: {
    color: "#FFFFFF",
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
  const diffBg = `${diffColor}26`; // ~15% opacity

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
        <View style={[cardStyles.diffBadge, { backgroundColor: diffBg }]}>
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
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  name: {
    fontFamily: serifFont,
    fontSize: 17,
    color: colors.textWarm,
    marginBottom: 10,
    fontWeight: "600",
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  categoryBadge: {
    backgroundColor: colors.accentBg,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 10,
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  subcategoryBadge: {
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  subcategoryText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 10,
    color: colors.textMuted,
  },
  diffBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  diffDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  diffText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 10,
  },
  description: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: colors.textBody,
    marginTop: 10,
    lineHeight: 18,
  },
});

// --- Empty State ---

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <View style={emptyStyles.container}>
      <Ionicons name="search-outline" size={44} color={colors.textDim} />
      <Text style={emptyStyles.title}>
        {hasFilters ? "No matches" : "No techniques yet"}
      </Text>
      <Text style={emptyStyles.subtitle}>
        {hasFilters
          ? "Try adjusting your filters or search term."
          : "Techniques will appear here once added."}
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
    fontFamily: serifFont,
    fontSize: 18,
    color: colors.textWarm,
    marginTop: 16,
    marginBottom: 6,
    fontWeight: "600",
  },
  subtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
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

  // Derive categories present in data (for section headers)
  const categoriesInData = useMemo(() => {
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

  // Group by category for section rendering
  const groupedData = useMemo(() => {
    const map = new Map<string, Technique[]>();
    for (const t of filtered) {
      const list = map.get(t.category) || [];
      list.push(t);
      map.set(t.category, list);
    }
    const result: { type: "header"; category: string; count: number; id: string }[] | { type: "technique"; technique: Technique; id: string }[] = [];
    const items: ({ type: "header"; category: string; count: number; id: string } | { type: "technique"; technique: Technique; id: string })[] = [];
    const sortedCats = Array.from(map.keys()).sort();
    for (const cat of sortedCats) {
      const techs = map.get(cat)!;
      items.push({ type: "header", category: cat, count: techs.length, id: `header-${cat}` });
      for (const t of techs) {
        items.push({ type: "technique", technique: t, id: t.id });
      }
    }
    return items;
  }, [filtered]);

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

  type ListItem =
    | { type: "header"; category: string; count: number; id: string }
    | { type: "technique"; technique: Technique; id: string };

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === "header") {
        const catColor = CATEGORY_COLORS[item.category] || colors.textMuted;
        return (
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: catColor }]} />
            <Text style={styles.sectionTitle}>{item.category}</Text>
            <Text style={styles.sectionCount}>{item.count}</Text>
          </View>
        );
      }
      return (
        <TechniqueCard
          technique={item.technique}
          onPress={() =>
            navigation.navigate("TechniqueDetail", {
              technique: item.technique,
            })
          }
        />
      );
    },
    [navigation]
  );

  const keyExtractor = useCallback((item: ListItem) => item.id, []);

  const ListHeader = (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Techniques</Text>
          <Text style={styles.headerSub}>
            {filtered.length} technique{filtered.length !== 1 ? "s" : ""} in library
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={16}
          color={colors.textDim}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search techniques..."
          placeholderTextColor={colors.textDim}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color={colors.textDim} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Pills */}
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

      {/* Difficulty + Beginner row */}
      <View style={styles.filterRow}>
        {(["beginner", "intermediate", "advanced"] as Difficulty[]).map(
          (diff) => {
            const c = DIFFICULTY_COLORS[diff];
            const active = activeDifficulty === diff;
            return (
              <TouchableOpacity
                key={diff}
                style={[
                  styles.diffChip,
                  active && { backgroundColor: `${c}26`, borderColor: `${c}4D` },
                ]}
                onPress={() => toggleDifficulty(diff)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.diffChipDot,
                    { backgroundColor: active ? c : colors.textDim },
                  ]}
                />
                <Text
                  style={[
                    styles.diffChipText,
                    active && { color: c },
                  ]}
                >
                  {difficultyLabel(diff)}
                </Text>
              </TouchableOpacity>
            );
          }
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
            name="star-outline"
            size={12}
            color={beginnerOnly ? colors.gold : colors.textDim}
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
        data={groupedData as ListItem[]}
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
    paddingBottom: 20,
  },
  headerTitle: {
    fontFamily: serifFont,
    fontSize: 28,
    color: colors.textWarm,
    fontWeight: "700",
    marginBottom: 4,
  },
  headerSub: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: colors.textMuted,
  },

  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textWarm,
    paddingVertical: 11,
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
    marginBottom: 20,
  },
  diffChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  diffChipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  diffChipText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 11,
    color: colors.textMuted,
  },

  // Beginner toggle
  beginnerToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  beginnerToggleActive: {
    backgroundColor: colors.goldBg,
    borderColor: colors.goldBorder,
  },
  beginnerToggleText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 11,
    color: colors.textDim,
  },
  beginnerToggleTextActive: {
    color: colors.gold,
  },

  // Section headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  sectionTitle: {
    fontFamily: "DMSans_500Medium",
    fontSize: 10,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    flex: 1,
  },
  sectionCount: {
    fontFamily: "DMSans_400Regular",
    fontSize: 10,
    color: colors.textDim,
  },
});
