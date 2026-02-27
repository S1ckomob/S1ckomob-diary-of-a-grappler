import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import { useSession } from "../hooks/useSession";

// --- Theme ---

const colors = {
  background: "#08080D",
  surface: "#11111A",
  surfaceRaised: "#1A1A26",
  accent: "#C41E3A",
  textPrimary: "#FFFFFF",
  textSecondary: "#9A9AA0",
  textMuted: "#5A5A64",
  border: "#1E1E2A",
};

// --- Main Screen ---

export default function ComposePostScreen() {
  const navigation = useNavigation();
  const { session: authSession } = useSession();
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  const canPost = content.trim().length > 0 && !posting;

  const handlePost = async () => {
    if (!canPost || !authSession?.user) return;
    setPosting(true);

    // Get user's gym_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("gym_id")
      .eq("id", authSession.user.id)
      .single();

    if (!profile?.gym_id) {
      Alert.alert("No gym", "You must be connected to a gym to post.");
      setPosting(false);
      return;
    }

    const { error } = await supabase.from("posts").insert({
      user_id: authSession.user.id,
      gym_id: profile.gym_id,
      content: content.trim(),
    });

    setPosting(false);

    if (error) {
      Alert.alert("Error", "Could not create post. Please try again.");
      return;
    }

    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity
          onPress={handlePost}
          disabled={!canPost}
          activeOpacity={0.7}
        >
          {posting ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Text
              style={[
                styles.postButtonText,
                !canPost && styles.postButtonDisabled,
              ]}
            >
              Post
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Input */}
      <View style={styles.body}>
        <TextInput
          style={styles.textInput}
          placeholder="Share something with your gym..."
          placeholderTextColor={colors.textMuted}
          value={content}
          onChangeText={setContent}
          multiline
          autoFocus
          maxLength={1000}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>
          {content.length} / 1000
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 16 : 20,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 16,
    color: colors.textSecondary,
  },
  headerTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 17,
    color: colors.textPrimary,
  },
  postButtonText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: colors.accent,
  },
  postButtonDisabled: {
    color: colors.textMuted,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  textInput: {
    flex: 1,
    fontFamily: "DMSans_400Regular",
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  charCount: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "right",
    paddingBottom: 16,
  },
});
