import { useRouter } from 'next/navigation';
import { tokenManager } from '@/lib/auth';
import { baseUrl } from '@/lib/baseUrl';

export const useApi = () => {
  const router = useRouter();

  const apiCall = async (url: string, options: RequestInit = {}) => {
    try {
      if (!tokenManager.isLoggedIn()) {
        router.replace('/login');
        throw new Error('Not authenticated');
      }

      const response = await tokenManager.makeAuthenticatedRequest(url, options);
      
      // If still unauthorized after token refresh attempt
      if (response.status === 401) {
        tokenManager.clearTokens();
        router.replace('/login');
        throw new Error('Authentication failed');
      }

      return response;
    } catch (error) {
      if (error instanceof Error && error.message === 'No access token available') {
        router.replace('/login');
      }
      throw error;
    }
  };

  const logout = async () => {
    const refreshToken = tokenManager.getRefreshToken();
    if (refreshToken) {
      try {
        await apiCall(`${baseUrl}/api/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh: refreshToken }),
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    tokenManager.clearTokens();
    router.replace('/login');
  };

  return { apiCall, logout };
};