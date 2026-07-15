import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '@/lib/api-client';

/** The seeded account list for the "User" filter — static, so it never refetches. */
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: Infinity,
  });
}
