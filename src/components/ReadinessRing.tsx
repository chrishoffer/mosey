import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text } from './ui';
import { palette } from '../theme/tokens';

/** A calm circular progress ring. Used for trip readiness. */
export function ReadinessRing({
  ratio,
  size = 64,
  strokeWidth = 7,
  color = palette.coral,
  trackColor = palette.line,
  centerLabel,
  centerSub,
}: {
  ratio: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  centerLabel?: string;
  centerSub?: string;
}) {
  const clamped = Math.max(0, Math.min(1, ratio));
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * clamped;
  const center = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={r} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          // start at 12 o'clock
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        {centerLabel ? (
          <Text variant="bodyStrong" color={color}>
            {centerLabel}
          </Text>
        ) : null}
        {centerSub ? (
          <Text variant="caption" color={palette.inkSoft}>
            {centerSub}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
