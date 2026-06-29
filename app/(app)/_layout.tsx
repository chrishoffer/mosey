import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Sparkle } from '../../src/components/Sparkle';
import { palette } from '../../src/theme/tokens';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.coral,
        tabBarInactiveTintColor: palette.inkSoft,
        tabBarStyle: {
          backgroundColor: palette.card,
          borderTopColor: palette.line,
          height: 90,
          paddingTop: 10,
        },
        tabBarLabelStyle: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color, size }) => <Ionicons name="briefcase" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ask"
        options={{
          title: 'Ask',
          // A modestly raised coral FAB — kept small enough that it never overlaps
          // the screen content above it or the labels beside it.
          tabBarIcon: ({ focused }) => (
            <View style={[styles.sparkleWrap, focused && styles.sparkleWrapActive]}>
              <Sparkle size={24} color={palette.white} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-sharp" size={size} color={color} />,
        }}
      />
      {/* Routes that exist under (app) but should not appear as tabs */}
      <Tabs.Screen name="new-trip" options={{ href: null }} />
      <Tabs.Screen name="paywall" options={{ href: null }} />
      <Tabs.Screen name="trip/[id]/index" options={{ href: null }} />
      <Tabs.Screen name="trip/[id]/post-trip" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  sparkleWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: palette.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -6,
    shadowColor: palette.coral,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  sparkleWrapActive: {
    backgroundColor: palette.coral,
    transform: [{ scale: 1.06 }],
  },
});
