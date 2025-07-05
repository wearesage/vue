import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { useAuth } from "../stores/auth";
import { useToast } from "../stores/toast";

// Always use explicit API URL - no magic Vite proxy bullshit
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:2223";

let apiClient: AxiosInstance | null = null;

export function createApiClient(): AxiosInstance {
  if (apiClient) return apiClient;

  apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  const authStore = useAuth();
  const toast = useToast();

  apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = authStore.authToken;
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      console.error("Request interceptor error:", error);
      return Promise.reject(error);
    }
  );

  apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      if (error.response) {
        const { status, data, config } = error.response;

        if (status === 401 && !originalRequest._retry) {
          // Don't auto-refresh for Spotify endpoints or auth endpoints
          const isSpotifyEndpoint = config?.url?.includes('/api/spotify');
          const isAuthEndpoint = config?.url?.includes('/api/auth/');
          
          if (!isSpotifyEndpoint && !isAuthEndpoint) {
            // Try to refresh token
            originalRequest._retry = true;
            
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken) {
              try {
                console.log("🔄 Attempting token refresh...");
                const refreshResponse = await axios.post(
                  `${API_BASE_URL}/api/auth/refresh`,
                  { refreshToken }
                );

                if (refreshResponse.status === 200) {
                  const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;
                  
                  // Update tokens in localStorage (auth store will pick them up)
                  localStorage.setItem("authToken", accessToken);
                  localStorage.setItem("refreshToken", newRefreshToken);
                  
                  // Update the original request with new token
                  originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                  
                  console.log("✅ Token refreshed, retrying original request");
                  return apiClient!(originalRequest);
                }
              } catch (refreshError) {
                console.error("❌ Token refresh failed:", refreshError);
                // Fall through to logout
              }
            }

            // Refresh failed or no refresh token, logout
            toast.error("Session expired. Please sign in again.");
            authStore.signOut();
          }
          // For Spotify endpoints, let the calling code handle the 401
        } else if (status === 403) {
          toast.error("Access denied.");
        } else if (status === 404) {
          toast.error("Resource not found.");
        } else if (status === 500) {
          toast.error("Server error. Please try again later.");
        } else if (data?.message) {
          toast.error(data.message);
        }
      } else if (error.request) {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error("An unexpected error occurred.");
      }

      return Promise.reject(error);
    }
  );

  return apiClient;
}

export function getApiClient(): AxiosInstance {
  if (!apiClient) {
    return createApiClient();
  }
  return apiClient;
}

export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) => getApiClient().get<T>(url, config),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => getApiClient().post<T>(url, data, config),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => getApiClient().put<T>(url, data, config),

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => getApiClient().patch<T>(url, data, config),

  delete: <T = any>(url: string, config?: AxiosRequestConfig) => getApiClient().delete<T>(url, config),
};
