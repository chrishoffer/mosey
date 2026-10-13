import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../../src/theme/tokens';

/** Bottom tabs once a trip exists (brief §4): Trip · Days · Explore · Pack · Ask.
 *  Map and Book are stack-style routes inside the trip, hidden from the bar. */
export default function TripTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.ground },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.faint,
        tabBarLabelStyle: { fontFamily: fonts.bodySemi, fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line, height: 86, paddingTop: 6 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trip',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="days"
        options={{
          title: 'Days',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => <Ionicons name="compass" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="pack"
        options={{
          title: 'Pack',
          tabBarIcon: ({ color, size }) => <Ionicons name="briefcase" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ask"
        options={{
          title: 'Ask',
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="map" options={{ href: null }} />
      <Tabs.Screen name="book" options={{ href: null }} />
      <Tabs.Screen name="grocery" options={{ href: null }} />
    </Tabs>
  );
}
