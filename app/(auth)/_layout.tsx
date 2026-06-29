import { Stack } from 'expo-router';
import { palette } from '../../src/theme/tokens';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.paper } }} />
  );
}
