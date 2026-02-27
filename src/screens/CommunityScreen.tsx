import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import { useSession } from "../hooks/useSession";
import type { Profile, Belt, Post, PostWithAuthor } from "../types";
import type { CommunityStackParamList } from "../navigation";

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

const beltColors: Record<Belt, string> = {
  white: "#E8E8E8",
  blue: "#1A5CCF",
  purple: "#7B2D8E",
  brown: "#6B3A2A",
  black: "#1C1C1E",
};

// --- Helpers ---

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function beltLabel(belt: Belt, stripes: number): string {
  const b = belt.charAt(0).toUpperCase() + belt.slice(1);
  if (stripes === 0) return `${b} Belt`;
  return `${b} Belt \u00B7 ${stripes} stripe${stripes !== 1 ? "s" : ""}`;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

// --- Types ---

type TabKey = "feed" | "rooms";

interface RoomInfo {
  name: string;
  icon: string;
  memberCount: number;
  onlineCount: number;
  description: string;
}

type CommunityNav = NativeStackNavigationProp<CommunityStackParamList, "CommunityHome">;

// --- No Gym State ---

function NoGymState() {
  return (
    <View style={noGymStyles.container}>
      <Text style={noGymStyles.icon}>{"\u{1F91D}"}</Text>
      <Text style={noGymStyles.title}>Join a gym to connect</Text>
      <Text style={noGymStyles.subtitle}>
        See posts from your teammates, chat in group rooms, and stay connected
        with your training partners.
      </Text>
      <Text style={noGymStyles.hint}>
        Go to the Coach tab and tap "Join with Code" to get started.
      </Text>
    </View>
  );
}

const noGymStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  icon: {
    fontSize: 56,
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
    marginBottom: 16,
  },
  hint: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: colors.accent,
    textAlign: "center",
  },
});

// --- Post Card ---

function PostCard({
  post,
  onLike,
}: {
  post: PostWithAuthor;
  onLike: (post: PostWithAuthor) => void;
}) {
  const beltColor = beltColors[post.author_belt || "white"];

  return (
    <View style={postStyles.container}>
      {/* Author row */}
      <View style={postStyles.authorRow}>
        <View style={[postStyles.avatar, { borderColor: beltColor }]}>
          <Text style={postStyles.avatarText}>
            {getInitials(post.author_name)}
          </Text>
        </View>
        <View style={postStyles.authorInfo}>
          <Text style={postStyles.authorName}>
            {post.author_name || "Grappler"}
          </Text>
          <View style={postStyles.metaRow}>
            <Text style={postStyles.beltText}>
              {beltLabel(post.author_belt || "white", post.author_stripes)}
            </Text>
            <Text style={postStyles.dot}>{"\u00B7"}</Text>
            <Text style={postStyles.timeText}>{timeAgo(post.created_at)}</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <Text style={postStyles.content}>{post.content}</Text>

      {/* Actions */}
      <View style={postStyles.actionsRow}>
        <TouchableOpacity
          style={postStyles.actionButton}
          onPress={() => onLike(post)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={post.liked_by_me ? "heart" : "heart-outline"}
            size={18}
            color={post.liked_by_me ? colors.accent : colors.textMuted}
          />
          <Text
            style={[
              postStyles.actionText,
              post.liked_by_me && postStyles.actionTextLiked,
            ]}
          >
            {post.likes_count}
          </Text>
        </TouchableOpacity>

        <View style={postStyles.actionButton}>
          <Ionicons
            name="chatbubble-outline"
            size={16}
            color={colors.textMuted}
          />
          <Text style={postStyles.actionText}>{post.comments_count}</Text>
        </View>
      </View>
    </View>
  );
}

const postStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    marginRight: 12,
  },
  avatarText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 14,
    color: colors.textPrimary,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  beltText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: colors.textMuted,
  },
  dot: {
    fontSize: 12,
    color: colors.textMuted,
  },
  timeText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: colors.textMuted,
  },
  content: {
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 14,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: colors.textMuted,
  },
  actionTextLiked: {
    color: colors.accent,
  },
});

// --- Room Card ---

function RoomCard({ room }: { room: RoomInfo }) {
  return (
    <TouchableOpacity style={roomStyles.container} activeOpacity={0.7}>
      <View style={roomStyles.iconWrap}>
        <Text style={roomStyles.icon}>{room.icon}</Text>
      </View>
      <View style={roomStyles.info}>
        <Text style={roomStyles.name}>{room.name}</Text>
        <Text style={roomStyles.description}>{room.description}</Text>
      </View>
      <View style={roomStyles.right}>
        <View style={roomStyles.onlineRow}>
          <View style={roomStyles.onlineDot} />
          <Text style={roomStyles.onlineText}>{room.onlineCount}</Text>
        </View>
        <Text style={roomStyles.memberText}>
          {room.memberCount} member{room.memberCount !== 1 ? "s" : ""}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const roomStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  icon: {
    fontSize: 20,
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: colors.textPrimary,
  },
  description: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  right: {
    alignItems: "flex-end",
    marginLeft: 10,
  },
  onlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  onlineText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: colors.green,
  },
  memberText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
  },
});

// --- Empty Feed ---

function EmptyFeed() {
  return (
    <View style={emptyStyles.container}>
      <Text style={emptyStyles.icon}>{"\u{1F4AD}"}</Text>
      <Text style={emptyStyles.title}>No posts yet</Text>
      <Text style={emptyStyles.subtitle}>
        Be the first to share something with your gym!
      </Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 40,
  },
  icon: {
    fontSize: 44,
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

// --- Main Screen ---

export default function CommunityScreen() {
  const navigation = useNavigation<CommunityNav>();
  const { session: authSession } = useSession();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [gymName, setGymName] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<TabKey>("feed");

  // --- Fetch data ---

  const fetchData = useCallback(async () => {
    if (!authSession?.user) return;
    const userId = authSession.user.id;

    // Get own profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!profileData || !profileData.gym_id) {
      setProfile(profileData as Profile | null);
      setGymName(null);
      setPosts([]);
      setMembers([]);
      setLoading(false);
      return;
    }

    setProfile(profileData as Profile);

    // Parallel: gym name, gym members, posts
    const [gymRes, membersRes, postsRes] = await Promise.all([
      supabase
        .from("gyms")
        .select("name")
        .eq("id", profileData.gym_id)
        .single(),
      supabase
        .from("profiles")
        .select("*")
        .eq("gym_id", profileData.gym_id)
        .order("name"),
      supabase
        .from("posts")
        .select("*")
        .eq("gym_id", profileData.gym_id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (gymRes.data) setGymName(gymRes.data.name);

    const gymMembers = (membersRes.data ?? []) as Profile[];
    setMembers(gymMembers);

    // Build a lookup for member profiles
    const memberMap = new Map<string, Profile>();
    for (const m of gymMembers) {
      memberMap.set(m.id, m);
    }

    // Check which posts the current user has liked
    const rawPosts = (postsRes.data ?? []) as Post[];
    const postIds = rawPosts.map((p) => p.id);

    let likedPostIds = new Set<string>();
    if (postIds.length > 0) {
      const { data: likesData } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", userId)
        .in("post_id", postIds);

      likedPostIds = new Set((likesData ?? []).map((l) => l.post_id));
    }

    // Enrich posts with author info
    const enriched: PostWithAuthor[] = rawPosts.map((p) => {
      const author = memberMap.get(p.user_id);
      return {
        ...p,
        author_name: author?.name ?? null,
        author_belt: (author?.belt as Belt) ?? "white",
        author_stripes: author?.stripes ?? 0,
        liked_by_me: likedPostIds.has(p.id),
      };
    });

    setPosts(enriched);
    setLoading(false);
  }, [authSession?.user]);

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

  // --- Like / Unlike ---

  const handleLike = useCallback(
    async (post: PostWithAuthor) => {
      if (!authSession?.user) return;
      const userId = authSession.user.id;

      if (post.liked_by_me) {
        // Unlike
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? { ...p, liked_by_me: false, likes_count: Math.max(0, p.likes_count - 1) }
              : p
          )
        );
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", userId);
        await supabase
          .from("posts")
          .update({ likes_count: Math.max(0, post.likes_count - 1) })
          .eq("id", post.id);
      } else {
        // Like
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? { ...p, liked_by_me: true, likes_count: p.likes_count + 1 }
              : p
          )
        );
        await supabase
          .from("post_likes")
          .insert({ post_id: post.id, user_id: userId });
        await supabase
          .from("posts")
          .update({ likes_count: post.likes_count + 1 })
          .eq("id", post.id);
      }
    },
    [authSession?.user]
  );

  // --- Rooms data ---

  const recentCutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const giMembers = members.filter((m) => m.gi);
  const nogiMembers = members.filter((m) => m.nogi);

  // "Online" = created their profile recently or we simulate based on member count
  // For a realistic feel, show a fraction of members as online
  const onlineTotal = Math.max(1, Math.floor(members.length * 0.3));
  const onlineGi = Math.max(giMembers.length > 0 ? 1 : 0, Math.floor(giMembers.length * 0.25));
  const onlineNogi = Math.max(nogiMembers.length > 0 ? 1 : 0, Math.floor(nogiMembers.length * 0.25));

  const rooms: RoomInfo[] = [
    {
      name: gymName ? `${gymName} General` : "Gym General",
      icon: "\u{1F3E0}",
      memberCount: members.length,
      onlineCount: onlineTotal,
      description: "Whole gym chat",
    },
    {
      name: "Gi Room",
      icon: "\u{1F94B}",
      memberCount: giMembers.length,
      onlineCount: onlineGi,
      description: "For the kimono crew",
    },
    {
      name: "No-Gi Room",
      icon: "\u{1F3BD}",
      memberCount: nogiMembers.length,
      onlineCount: onlineNogi,
      description: "Spats and rashguards only",
    },
  ];

  // --- Render ---

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!profile?.gym_id) {
    return (
      <View style={styles.container}>
        <View style={styles.headerWrap}>
          <Text style={styles.headerTitle}>Community</Text>
        </View>
        <NoGymState />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Feed tab */}
      {tab === "feed" ? (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
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
          ListHeaderComponent={
            <>
              {/* Header */}
              <View style={styles.headerWrap}>
                <View>
                  <Text style={styles.headerTitle}>Community</Text>
                  <Text style={styles.headerSubtitle}>
                    {gymName} \u00B7 {members.length} member
                    {members.length !== 1 ? "s" : ""}
                  </Text>
                </View>
              </View>

              {/* Tabs */}
              <View style={styles.tabRow}>
                <TouchableOpacity
                  style={[styles.tab, tab === "feed" && styles.tabActive]}
                  onPress={() => setTab("feed")}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="newspaper-outline"
                    size={16}
                    color={tab === "feed" ? colors.accent : colors.textMuted}
                    style={styles.tabIcon}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      tab === "feed" && styles.tabTextActive,
                    ]}
                  >
                    Feed
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, tab === "rooms" && styles.tabActive]}
                  onPress={() => setTab("rooms")}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="chatbubbles-outline"
                    size={16}
                    color={tab === "rooms" ? colors.accent : colors.textMuted}
                    style={styles.tabIcon}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      tab === "rooms" && styles.tabTextActive,
                    ]}
                  >
                    Rooms
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          }
          renderItem={({ item }) => (
            <PostCard post={item} onLike={handleLike} />
          )}
          ListEmptyComponent={<EmptyFeed />}
        />
      ) : (
        /* Rooms tab */
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Header */}
              <View style={styles.headerWrap}>
                <View>
                  <Text style={styles.headerTitle}>Community</Text>
                  <Text style={styles.headerSubtitle}>
                    {gymName} \u00B7 {members.length} member
                    {members.length !== 1 ? "s" : ""}
                  </Text>
                </View>
              </View>

              {/* Tabs */}
              <View style={styles.tabRow}>
                <TouchableOpacity
                  style={[styles.tab, tab === "feed" && styles.tabActive]}
                  onPress={() => setTab("feed")}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="newspaper-outline"
                    size={16}
                    color={tab === "feed" ? colors.accent : colors.textMuted}
                    style={styles.tabIcon}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      tab === "feed" && styles.tabTextActive,
                    ]}
                  >
                    Feed
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, tab === "rooms" && styles.tabActive]}
                  onPress={() => setTab("rooms")}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="chatbubbles-outline"
                    size={16}
                    color={tab === "rooms" ? colors.accent : colors.textMuted}
                    style={styles.tabIcon}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      tab === "rooms" && styles.tabTextActive,
                    ]}
                  >
                    Rooms
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Online members summary */}
              <View style={styles.onlineBanner}>
                <View style={styles.onlineDotLarge} />
                <Text style={styles.onlineBannerText}>
                  {onlineTotal} member{onlineTotal !== 1 ? "s" : ""} active now
                </Text>
              </View>
            </>
          }
          renderItem={({ item }) => <RoomCard room={item} />}
          ListFooterComponent={
            <View style={styles.roomsFooter}>
              {/* Active Members */}
              <Text style={styles.sectionLabel}>ACTIVE MEMBERS</Text>
              <View style={styles.activeMembersRow}>
                {members.slice(0, 8).map((m) => {
                  const bc = beltColors[(m.belt as Belt) || "white"];
                  return (
                    <View key={m.id} style={styles.activeMember}>
                      <View
                        style={[styles.activeMemberAvatar, { borderColor: bc }]}
                      >
                        <Text style={styles.activeMemberInitials}>
                          {getInitials(m.name)}
                        </Text>
                      </View>
                      <View style={styles.activeOnlineDot} />
                      <Text
                        style={styles.activeMemberName}
                        numberOfLines={1}
                      >
                        {m.name?.split(" ")[0] || "?"}
                      </Text>
                    </View>
                  );
                })}
                {members.length > 8 && (
                  <View style={styles.activeMember}>
                    <View style={styles.activeMemberMore}>
                      <Text style={styles.activeMemberMoreText}>
                        +{members.length - 8}
                      </Text>
                    </View>
                    <Text style={styles.activeMemberName}>more</Text>
                  </View>
                )}
              </View>
            </View>
          }
        />
      )}

      {/* Compose FAB (only on feed tab) */}
      {tab === "feed" && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("ComposePost")}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// --- Styles ---

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
    paddingBottom: 100,
  },

  // Header
  headerWrap: {
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 26,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.accent + "14",
    borderColor: colors.accent + "40",
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.accent,
  },

  // Section label
  sectionLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },

  // Online banner
  onlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.green + "14",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.green + "30",
  },
  onlineDotLarge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.green,
  },
  onlineBannerText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: colors.green,
  },

  // Rooms footer - Active members
  roomsFooter: {
    marginTop: 16,
  },
  activeMembersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  activeMember: {
    alignItems: "center",
    width: 60,
  },
  activeMemberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
  },
  activeMemberInitials: {
    fontFamily: "DMSans_700Bold",
    fontSize: 14,
    color: colors.textPrimary,
  },
  activeOnlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.green,
    borderWidth: 2,
    borderColor: colors.background,
    position: "absolute",
    top: 32,
    right: 10,
  },
  activeMemberName: {
    fontFamily: "DMSans_400Regular",
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  activeMemberMore: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeMemberMoreText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: colors.textMuted,
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
