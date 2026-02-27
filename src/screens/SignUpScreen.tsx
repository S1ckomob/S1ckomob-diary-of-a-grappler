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
import { supabase } from "../lib/supabase";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../navigation";

type Props = NativeStackScreenProps<AuthStackParamList, "SignUp">;

export default function SignUpScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSignUp() {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) {
        Alert.alert("Sign Up Error", error.message);
      } else {
        setSuccess(true);
      }
    } catch (e: any) {
      Alert.alert(
        "Sign Up Error",
        e?.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.message}>
            We've sent a confirmation link to{" "}
            <Text style={styles.emailText}>{email}</Text>. Please verify your
            email to complete sign up.
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.link}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to get started</Text>

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
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#5A5A64"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.bottomText}>
            Already have an account?{" "}
            <Text style={styles.bottomLink}>Sign In</Text>
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
  centered: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
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
  message: {
    fontFamily: "DMSans_400Regular",
    fontSize: 16,
    color: "#9A9AA0",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  emailText: {
    fontFamily: "DMSans_500Medium",
    color: "#FFFFFF",
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
    fontSize: 16,
    color: "#C41E3A",
    textAlign: "center",
  },
  bottomText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: "#9A9AA0",
    textAlign: "center",
    marginTop: 8,
  },
  bottomLink: {
    fontFamily: "DMSans_500Medium",
    color: "#C41E3A",
  },
});
