import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useSession } from "../hooks/useSession";
import LoginScreen from "../screens/LoginScreen";
import SignUpScreen from "../screens/SignUpScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import JournalScreen from "../screens/JournalScreen";
import LogSessionScreen from "../screens/LogSessionScreen";

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type JournalStackParamList = {
  JournalHome: undefined;
  LogSession: undefined;
};

// --- Placeholder tab screens ---

function PlaceholderScreen({ name }: { name: string }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.text}>{name}</Text>
    </View>
  );
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
const AuthStack_ = createNativeStackNavigator<AuthStackParamList>();
const JournalStack = createNativeStackNavigator<JournalStackParamList>();

function JournalStackScreen() {
  return (
    <JournalStack.Navigator screenOptions={{ headerShown: false }}>
      <JournalStack.Screen name="JournalHome" component={JournalScreen} />
      <JournalStack.Screen
        name="LogSession"
        component={LogSessionScreen}
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
    </JournalStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#C41E3A",
        tabBarInactiveTintColor: "#5A5A64",
        tabBarStyle: {
          backgroundColor: "#11111A",
          borderTopColor: "#1E1E2A",
        },
        tabBarLabelStyle: {
          fontFamily: "DMSans_500Medium",
          fontSize: 11,
        },
      }}
    >
      <Tab.Screen name="Journal" component={JournalStackScreen} />
      <Tab.Screen name="Techniques" component={TechniquesScreen} />
      <Tab.Screen name="Coach" component={CoachScreen} />
      <Tab.Screen name="Community" component={CommunityScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <AuthStack_.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack_.Screen name="Login" component={LoginScreen} />
      <AuthStack_.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack_.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack_.Navigator>
  );
}

// --- Root ---

export default function Navigation() {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#C41E3A" />
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
    backgroundColor: "#08080D",
  },
  text: {
    fontFamily: "DMSans_400Regular",
    fontSize: 18,
    color: "#FFFFFF",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#08080D",
  },
});
