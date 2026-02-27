import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useSession } from "../hooks/useSession";
import LoginScreen from "../screens/LoginScreen";
import SignUpScreen from "../screens/SignUpScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

// --- Placeholder tab screens ---

function PlaceholderScreen({ name }: { name: string }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.text}>{name}</Text>
    </View>
  );
}

function JournalScreen() {
  return <PlaceholderScreen name="Journal" />;
}

function TechniquesScreen() {
  return <PlaceholderScreen name="Techniques" />;
}

function CoachScreen() {
  return <PlaceholderScreen name="Coach" />;
}

function CommunityScreen() {
  return <PlaceholderScreen name="Community" />;
}

function ProfileScreen() {
  return <PlaceholderScreen name="Profile" />;
}

// --- Navigators ---

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<AuthStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1A73E8",
        tabBarInactiveTintColor: "#8E8E93",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E5E5EA",
        },
      }}
    >
      <Tab.Screen name="Journal" component={JournalScreen} />
      <Tab.Screen name="Techniques" component={TechniquesScreen} />
      <Tab.Screen name="Coach" component={CoachScreen} />
      <Tab.Screen name="Community" component={CommunityScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

// --- Root ---

export default function Navigation() {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1A73E8" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  text: {
    fontFamily: "DMSans_400Regular",
    fontSize: 18,
    color: "#1C1C1E",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
});
