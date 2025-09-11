import { baseUrl } from './baseUrl';

interface TokenResponse {
  access: string;
  refresh: string;
}

class TokenManager {
  private static instance: TokenManager;

  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access');
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh');
  }

  setTokens(access: string, refresh: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('access', access);
    localStorage.setItem('refresh', refresh);
  }

  clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
  }

  async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${baseUrl}/api/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh: refreshToken,
        }),
      });

      if (response.ok) {
        const data: TokenResponse = await response.json();
        this.setTokens(data.access, data.refresh);
        return data.access;
      } else {
        // Refresh token is invalid, clear tokens
        this.clearTokens();
        return null;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.clearTokens();
      return null;
    }
  }

  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    let accessToken = this.getAccessToken();

    // First attempt with current access token
    const makeRequest = async (token: string): Promise<Response> => {
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
        },
      });
    };

    if (accessToken) {
      const response = await makeRequest(accessToken);
      
      // If unauthorized, try to refresh token
      if (response.status === 401) {
        const newAccessToken = await this.refreshAccessToken();
        if (newAccessToken) {
          // Retry with new token
          return makeRequest(newAccessToken);
        }
      }
      
      return response;
    }

    // No access token available
    throw new Error('No access token available');
  }

  isLoggedIn(): boolean {
    return this.getAccessToken() !== null && this.getRefreshToken() !== null;
  }
}

export const tokenManager = TokenManager.getInstance();