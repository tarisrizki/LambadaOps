import { authKeys } from './query-keys';
import { login, register } from './client';

export const authMutations = {
  login: () => ({
    mutationKey: [...authKeys.all, 'login'] as const,
    mutationFn: login,
  }),
  register: () => ({
    mutationKey: [...authKeys.all, 'register'] as const,
    mutationFn: register,
  }),
};
