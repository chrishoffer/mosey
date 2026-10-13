import { Redirect } from 'expo-router';

// Entry: the plan flow is the front door. The sample trip (mock data) is
// reachable from search's "open your trip" shortcut and at /trip/1.
export default function Index() {
  return <Redirect href="/(plan)/search" />;
}
