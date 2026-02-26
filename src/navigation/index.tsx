import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, StyleSheet } from "react-native";

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

const Tab = createBottomTabNavigator();

export default function Navigation() {
  return (
    <NavigationContainer>
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
});
