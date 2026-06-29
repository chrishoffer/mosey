import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { radius } from '../theme/tokens';

/** The Mosey brand mark from the concept: a rounded sea-gradient tile with a white
 *  rolling "hill" (mosey = an unhurried wander) and a small marigold sun. Distinct
 *  from the Ask Mosey sparkle, which is its own mark. */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: radius.sm, overflow: 'hidden' }}>
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <Defs>
          <LinearGradient id="moseyLogo" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#179B92" />
            <Stop offset="1" stopColor="#0C6A63" />
          </LinearGradient>
        </Defs>
        <Rect width="32" height="32" rx="10" fill="url(#moseyLogo)" />
        <Circle cx="16" cy="9.5" r="3.3" fill="#E9A732" />
        <Path
          d="M5 22c4-1.3 5.3-8 10.6-8s6.6 6.7 10.6 8"
          stroke="#FFFFFF"
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}
