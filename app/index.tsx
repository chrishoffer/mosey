import { Redirect } from 'expo-router';

/** Entry — the AuthGate in _layout handles the real redirect; this points the
 *  bare "/" at the app shell. */
export default function Index() {
  return <Redirect href="/(app)" />;
}
