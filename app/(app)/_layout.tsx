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
          tabBarIcon: () => (
            <View style={styles.sparkleWrap}>
              <Sparkle size={26} color={palette.white} />
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
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: palette.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14,
    shadowColor: palette.coral,
    shadowOpacity: 0.7,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
});
