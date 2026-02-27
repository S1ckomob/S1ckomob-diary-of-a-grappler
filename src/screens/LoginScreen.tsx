import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "../lib/supabase";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../navigation";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email || !password) {
      Alert.alert("Error", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) Alert.alert("Sign In Error", error.message);
    } catch (e: any) {
      Alert.alert(
        "Sign In Error",
        e?.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      const redirectUri = makeRedirectUri();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUri },
      });
      if (error) {
        Alert.alert("Google Sign In Error", error.message);
        return;
      }
      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUri
        );
        if (result.type === "success" && result.url) {
          const url = new URL(result.url);
          const params = new URLSearchParams(
            url.hash ? url.hash.substring(1) : url.search.substring(1)
          );
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");
          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          }
        }
      }
    } catch (e: any) {
      Alert.alert(
        "Google Sign In Error",
        e?.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAppleSignIn() {
    try {
      setLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (credential.identityToken) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: "apple",
          token: credential.identityToken,
        });
        if (error) Alert.alert("Apple Sign In Error", error.message);
      }
    } catch (e: any) {
      if (e.code !== "ERR_REQUEST_CANCELED") {
        Alert.alert("Apple Sign In Error", e.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Diary of a Grappler</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#5A5A64"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#5A5A64"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("ForgotPassword")}
        >
          <Text style={styles.link}>Forgot Password?</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.socialButton}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          <Text style={styles.socialButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        {Platform.OS === "ios" && (
          <TouchableOpacity
            style={[styles.socialButton, styles.appleButton]}
            onPress={handleAppleSignIn}
            disabled={loading}
          >
            <Text style={[styles.socialButtonText, styles.appleButtonText]}>
              Continue with Apple
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
          <Text style={styles.bottomText}>
            Don't have an account?{" "}
            <Text style={styles.bottomLink}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#08080D",
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  title: {
    fontFamily: "DMSans_700Bold",
    fontSize: 28,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 16,
    color: "#9A9AA0",
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    fontFamily: "DMSans_400Regular",
    fontSize: 16,
    color: "#FFFFFF",
    backgroundColor: "#11111A",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1E1E2A",
  },
  primaryButton: {
    backgroundColor: "#C41E3A",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  primaryButtonText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  link: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: "#C41E3A",
    textAlign: "center",
    marginBottom: 24,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#1E1E2A",
  },
  dividerText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: "#5A5A64",
    marginHorizontal: 16,
  },
  socialButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1E1E2A",
    backgroundColor: "#11111A",
  },
  socialButtonText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 16,
    color: "#FFFFFF",
  },
  appleButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
  },
  appleButtonText: {
    color: "#000000",
  },
  bottomText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: "#9A9AA0",
    textAlign: "center",
    marginTop: 24,
  },
  bottomLink: {
    fontFamily: "DMSans_500Medium",
    color: "#C41E3A",
  },
});
