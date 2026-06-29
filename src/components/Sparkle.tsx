import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { palette } from '../theme/tokens';

/** The Ask Mosey sparkle — a four-point star with a small companion glint.
 *  Mosey's signature mark (§8). */
export function Sparkle({ size = 22, color = palette.coral }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13 2c.3 3.6 1.4 6 3 7.6 1.6 1.6 4 2.7 6 3-2.6.3-5 1.4-6.6 3C13.8 17.2 13.3 19.6 13 22c-.3-2.4-.8-4.8-2.4-6.4C9 14 6.6 12.9 4 12.6c2.4-.3 4.8-.8 6.4-2.4C12 8.6 12.7 5.6 13 2Z"
        fill={color}
      />
      <Path
        d="M5.5 3.5c.15 1.3.5 2 1.2 2.7.7.7 1.4 1 2.3 1.2-.9.15-1.6.5-2.3 1.2-.7.7-1 1.4-1.2 2.7-.15-1.3-.5-2-1.2-2.7-.7-.7-1.4-1-2.3-1.2.9-.15 1.6-.5 2.3-1.2.7-.7 1-1.4 1.2-2.7Z"
        fill={color}
        opacity={0.55}
      />
    </Svg>
  );
}
