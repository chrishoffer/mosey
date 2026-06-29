import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Sparkle } from '../../src/components/Sparkle';
import { palette, shadow } from '../../src/theme/tokens';

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
          height: 88,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Shelf',
          tabBarIcon: ({ color, size }) => <Ionicons name="albums" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ask"
        options={{
          title: 'Ask Mosey',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.sparkleWrap, focused && styles.sparkleActive]}>
              <Sparkle size={26} color={focused ? palette.white : palette.coral} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Family',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
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
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: palette.paper,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -6,
    ...shadow.soft,
  },
  sparkleActive: {
    backgroundColor: palette.coral,
  },
});
