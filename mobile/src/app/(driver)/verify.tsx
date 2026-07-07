import { useRouter } from 'expo-router';
import DriverApplicationForm from '@/components/driver/DriverApplicationForm';

/**
 * Driver-side entry: an already-registered driver completing/updating their
 * verification documents. On submit, return to the driver dashboard.
 */
export default function DriverVerifyScreen() {
  const router = useRouter();
  return <DriverApplicationForm onDone={() => router.replace('/(driver)')} />;
}
