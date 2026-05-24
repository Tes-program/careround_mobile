import { Redirect } from 'expo-router';

/**
 * Redirect the bare /nurse path to the Tasks tab (default tab).
 */
export default function NurseIndex() {
  return <Redirect href="/(app)/nurse/tasks" />;
}
