import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useSession } from "../hooks/useSession";
import type { Profile, Gym, Goal } from "../types";
import type { CoachStackParamList } from "../navigation";

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

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function progressPercent(current: number, target: number | null): number {
  if (!target || target <= 0) return 0;
  return Math.min(current / target, 1);
}

function isGoalComplete(goal: Goal): boolean {
  return goal.completed || (goal.target !== null && goal.current >= goal.target);
}

// --- Goal Card ---

function GoalCard({
  goal,
  onToggle,
  onIncrement,
}: {
  goal: Goal;
  onToggle: () => void;
  onIncrement: () => void;
}) {
  const pct = progressPercent(goal.current, goal.target);
  const pctDisplay = Math.round(pct * 100);
  const complete = isGoalComplete(goal);
  const barColor = complete ? colors.green : pct >= 0.5 ? colors.gold : colors.accent;

  return (
    <View style={[goalStyles.container, complete && goalStyles.containerComplete]}>
      <View style={goalStyles.header}>
        <TouchableOpacity
          style={[goalStyles.check, complete && goalStyles.checkDone]}
          onPress={onToggle}
          activeOpacity={0.7}
        >
          {complete && <Text style={goalStyles.checkMark}>{"\u{2713}"}</Text>}
        </TouchableOpacity>
        <View style={goalStyles.headerText}>
          <Text
            style={[
              goalStyles.type,
              complete && goalStyles.typeComplete,
            ]}
          >
            {goal.goal_type}
          </Text>
          {goal.description && (
            <Text
              style={[goalStyles.description, complete && goalStyles.descComplete]}
              numberOfLines={2}
            >
              {goal.description}
            </Text>
          )}
        </View>
        <View style={goalStyles.badges}>
          {goal.set_by_coach && (
            <View style={goalStyles.coachBadge}>
              <Ionicons name="school" size={10} color={colors.gold} />
              <Text style={goalStyles.coachBadgeText}>Coach</Text>
            </View>
          )}
          {goal.target !== null && (
            <Text style={[goalStyles.pctText, { color: barColor }]}>
              {pctDisplay}%
            </Text>
          )}
        </View>
      </View>

      {goal.target !== null && (
        <View style={goalStyles.progressSection}>
          <View style={goalStyles.progressBar}>
            <View
              style={[
                goalStyles.progressFill,
                { width: `${pct * 100}%`, backgroundColor: barColor },
              ]}
            />
          </View>
          <View style={goalStyles.progressLabelRow}>
            <Text style={goalStyles.progressLabel}>
              {goal.current} / {goal.target}
              {goal.unit ? ` ${goal.unit}` : ""}
            </Text>
            {!complete && (
              <TouchableOpacity
                style={goalStyles.incrementButton}
                onPress={onIncrement}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="add-circle" size={22} color={barColor} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {goal.coach_note && (
        <View style={goalStyles.noteRow}>
          <Ionicons name="chatbubble" size={12} color={colors.textMuted} />
          <Text style={goalStyles.noteText}>{goal.coach_note}</Text>
        </View>
      )}
    </View>
  );
}

const goalStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  containerComplete: {
    opacity: 0.7,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 1,
  },
  checkDone: {
    borderColor: colors.green,
    backgroundColor: colors.green,
  },
  checkMark: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  headerText: {
    flex: 1,
  },
  type: {
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: colors.textPrimary,
  },
  typeComplete: {
    color: colors.textMuted,
    textDecorationLine: "line-through",
  },
  description: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 19,
  },
  descComplete: {
    color: colors.textMuted,
    textDecorationLine: "line-through",
  },
  badges: {
    alignItems: "flex-end",
    marginLeft: 8,
    gap: 6,
  },
  coachBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.gold + "18",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  coachBadgeText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 11,
    color: colors.gold,
  },
  pctText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 14,
  },
  progressSection: {
    marginTop: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceRaised,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: colors.textMuted,
  },
  incrementButton: {
    padding: 2,
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  noteText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
    fontStyle: "italic",
    lineHeight: 19,
  },
});

// --- Gym Card ---

function GymCard({ gym }: { gym: Gym }) {
  return (
    <View style={gymStyles.container}>
      <Text style={gymStyles.icon}>{"\u{1F3E0}"}</Text>
      <View style={gymStyles.info}>
        <Text style={gymStyles.name}>{gym.name}</Text>
        <Text style={gymStyles.code}>Code: {gym.code}</Text>
      </View>
    </View>
  );
}

const gymStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  icon: {
    fontSize: 28,
    marginRight: 14,
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: "DMSans_700Bold",
    fontSize: 17,
    color: colors.textPrimary,
  },
  code: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 3,
  },
});

// --- No Gym State ---

function NoGymState({ onJoin }: { onJoin: () => void }) {
  return (
    <View style={noGymStyles.container}>
      <Text style={noGymStyles.icon}>{"\u{1F3E0}"}</Text>
      <Text style={noGymStyles.title}>No gym connected</Text>
      <Text style={noGymStyles.subtitle}>
        Join your gym to receive goals and feedback from your coach.
      </Text>
      <TouchableOpacity
        style={noGymStyles.button}
        onPress={onJoin}
        activeOpacity={0.8}
      >
        <Text style={noGymStyles.buttonText}>Join with Code</Text>
      </TouchableOpacity>
    </View>
  );
}

const noGymStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 28,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  icon: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontFamily: "DMSans_700Bold",
    fontSize: 17,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 18,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 14,
    color: colors.textPrimary,
  },
});

// --- Empty Goals ---

function EmptyGoals() {
  return (
    <View style={emptyStyles.container}>
      <Text style={emptyStyles.icon}>{"\u{1F3AF}"}</Text>
      <Text style={emptyStyles.title}>No goals this month</Text>
      <Text style={emptyStyles.subtitle}>
        Set a goal to keep your training on track.
      </Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: 32,
    paddingHorizontal: 40,
  },
  icon: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontFamily: "DMSans_700Bold",
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});

// --- Progress Summary Card ---

function ProgressSummary({
  total,
  completed,
}: {
  total: number;
  completed: number;
}) {
  if (total === 0) return null;
  const pct = Math.round((completed / total) * 100);
  const barColor = pct === 100 ? colors.green : pct >= 50 ? colors.gold : colors.accent;

  return (
    <View style={summaryStyles.container}>
      <View style={summaryStyles.textRow}>
        <View style={summaryStyles.left}>
          <Text style={summaryStyles.pct}>{pct}%</Text>
          <Text style={summaryStyles.label}>complete</Text>
        </View>
        <Text style={summaryStyles.count}>
          {completed} of {total} goals done
        </Text>
      </View>
      <View style={summaryStyles.track}>
        <View
          style={[
            summaryStyles.fill,
            { width: `${pct}%`, backgroundColor: barColor },
          ]}
        />
      </View>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  textRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 12,
  },
  left: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  pct: {
    fontFamily: "DMSans_700Bold",
    fontSize: 28,
    color: colors.textPrimary,
  },
  label: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textMuted,
  },
  count: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: colors.textSecondary,
  },
  track: {
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

type CoachNav = NativeStackNavigationProp<CoachStackParamList, "CoachHome">;

export default function CoachScreen() {
  const navigation = useNavigation<CoachNav>();
  const { session: authSession } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [gym, setGym] = useState<Gym | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const fetchData = useCallback(async () => {
    if (!authSession?.user) return;
    const userId = authSession.user.id;

    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileData) {
      setProfile(profileData as Profile);

      // Fetch gym if connected
      if (profileData.gym_id) {
        const { data: gymData } = await supabase
          .from("gyms")
          .select("*")
          .eq("id", profileData.gym_id)
          .single();
        if (gymData) setGym(gymData as Gym);
      } else {
        setGym(null);
      }
    }

    // Fetch current month goals
    const { data: goalsData } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .eq("month", currentMonth)
      .eq("year", currentYear)
      .order("created_at", { ascending: true });

    if (goalsData) setGoals(goalsData as Goal[]);
    setLoading(false);
  }, [authSession?.user, currentMonth, currentYear]);

  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener("focus", () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation, fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const toggleGoal = async (goal: Goal) => {
    const newCompleted = !goal.completed;
    const newCurrent = newCompleted && goal.target ? goal.target : goal.current;

    setGoals((prev) =>
      prev.map((g) =>
        g.id === goal.id
          ? { ...g, completed: newCompleted, current: newCurrent }
          : g
      )
    );

    await supabase
      .from("goals")
      .update({ completed: newCompleted, current: newCurrent })
      .eq("id", goal.id);
  };

  const incrementGoal = async (goal: Goal) => {
    if (!goal.target || goal.current >= goal.target) return;
    const newCurrent = goal.current + 1;
    const newCompleted = newCurrent >= goal.target;

    setGoals((prev) =>
      prev.map((g) =>
        g.id === goal.id
          ? { ...g, current: newCurrent, completed: newCompleted }
          : g
      )
    );

    await supabase
      .from("goals")
      .update({ current: newCurrent, completed: newCompleted })
      .eq("id", goal.id);
  };

  // Separate active and completed
  const activeGoals = goals.filter((g) => !isGoalComplete(g));
  const completedGoals = goals.filter((g) => isGoalComplete(g));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Coach</Text>
        </View>

        {/* AI Coach Card */}
        <TouchableOpacity
          style={aiCardStyles.container}
          onPress={() => navigation.navigate("AICoach")}
          activeOpacity={0.8}
        >
          <View style={aiCardStyles.iconWrap}>
            <Text style={aiCardStyles.icon}>{"\u{1F916}"}</Text>
          </View>
          <View style={aiCardStyles.content}>
            <Text style={aiCardStyles.title}>AI Coach</Text>
            <Text style={aiCardStyles.subtitle}>
              Get personalized BJJ advice based on your game DNA
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.accent} />
        </TouchableOpacity>

        {/* Gym Section */}
        {gym ? (
          <GymCard gym={gym} />
        ) : (
          <NoGymState onJoin={() => navigation.navigate("JoinGym")} />
        )}

        {/* Goals Header */}
        <View style={styles.goalsHeader}>
          <View>
            <Text style={styles.sectionLabel}>
              {MONTH_NAMES[currentMonth - 1]} Goals
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addGoalButton}
            onPress={() => navigation.navigate("AddGoal")}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={16} color={colors.textPrimary} />
            <Text style={styles.addGoalText}>Add Goal</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Summary */}
        <ProgressSummary total={goals.length} completed={completedGoals.length} />

        {/* Active Goals */}
        {goals.length > 0 ? (
          <>
            {activeGoals.length > 0 && (
              <>
                <Text style={styles.subSectionLabel}>
                  IN PROGRESS ({activeGoals.length})
                </Text>
                {activeGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onToggle={() => toggleGoal(goal)}
                    onIncrement={() => incrementGoal(goal)}
                  />
                ))}
              </>
            )}

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
              <>
                <Text style={styles.subSectionLabel}>
                  COMPLETED ({completedGoals.length})
                </Text>
                {completedGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onToggle={() => toggleGoal(goal)}
                    onIncrement={() => incrementGoal(goal)}
                  />
                ))}
              </>
            )}
          </>
        ) : (
          <EmptyGoals />
        )}
      </ScrollView>
    </View>
  );
}

const aiCardStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accent + "14",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.accent + "30",
    marginBottom: 24,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.accent + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  icon: {
    fontSize: 22,
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
});

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
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Header
  header: {
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 26,
    color: colors.textPrimary,
  },

  // Goals header
  goalsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  addGoalButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addGoalText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: colors.textPrimary,
  },

  // Sub-section
  subSectionLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },
});
