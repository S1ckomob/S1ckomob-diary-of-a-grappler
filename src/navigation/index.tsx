import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../hooks/useSession";
import { useProfile } from "../hooks/useProfile";
import OnboardingScreen from "../screens/OnboardingScreen";
import LoginScreen from "../screens/LoginScreen";
import SignUpScreen from "../screens/SignUpScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import JournalScreen from "../screens/JournalScreen";
import LogSessionScreen from "../screens/LogSessionScreen";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import TechniquesScreen from "../screens/TechniquesScreen";
import TechniqueDetailScreen from "../screens/TechniqueDetailScreen";
import CoachScreen from "../screens/CoachScreen";
import JoinGymScreen from "../screens/JoinGymScreen";
import AddGoalScreen from "../screens/AddGoalScreen";
import CommunityScreen from "../screens/CommunityScreen";
import type { Technique } from "../types";

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type JournalStackParamList = {
  JournalHome: undefined;
  LogSession: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
};

export type TechniquesStackParamList = {
  TechniquesHome: undefined;
  TechniqueDetail: { technique: Technique };
};

export type CoachStackParamList = {
  CoachHome: undefined;
  JoinGym: undefined;
  AddGoal: undefined;
};

// --- Navigators ---

const Tab = createBottomTabNavigator();
const AuthStack_ = createNativeStackNavigator<AuthStackParamList>();
const JournalStack = createNativeStackNavigator<JournalStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const TechniquesStack_ = createNativeStackNavigator<TechniquesStackParamList>();
const CoachStack_ = createNativeStackNavigator<CoachStackParamList>();

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

function TechniquesStackScreen() {
  return (
    <TechniquesStack_.Navigator screenOptions={{ headerShown: false }}>
      <TechniquesStack_.Screen
        name="TechniquesHome"
        component={TechniquesScreen}
      />
      <TechniquesStack_.Screen
        name="TechniqueDetail"
        component={TechniqueDetailScreen}
      />
    </TechniquesStack_.Navigator>
  );
}

function CoachStackScreen() {
  return (
    <CoachStack_.Navigator screenOptions={{ headerShown: false }}>
      <CoachStack_.Screen name="CoachHome" component={CoachScreen} />
      <CoachStack_.Screen
        name="JoinGym"
        component={JoinGymScreen}
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
      <CoachStack_.Screen
        name="AddGoal"
        component={AddGoalScreen}
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
    </CoachStack_.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
      <ProfileStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
    </ProfileStack.Navigator>
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
      <Tab.Screen
        name="Journal"
        component={JournalStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Techniques"
        component={TechniquesStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bulb-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Coach"
        component={CoachStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flag-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
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
  const { session, loading: sessionLoading } = useSession();
  const { profile, loading: profileLoading, refetch: refetchProfile } = useProfile(session);

  if (sessionLoading || (session && profileLoading)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#C41E3A" />
      </View>
    );
  }

  const needsOnboarding = session && (!profile || profile.name === null);

  return (
    <NavigationContainer>
      {!session ? (
        <AuthStack />
      ) : needsOnboarding ? (
        <OnboardingScreen userId={session.user.id} onComplete={refetchProfile} />
      ) : (
        <MainTabs />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#08080D",
  },
});
