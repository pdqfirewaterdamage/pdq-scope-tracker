import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function HubRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(app)/scope/login');
  }, []);

  return null;
}
