import { ApiResponse } from "../../shared/types"
import { useAuthStore, authActions } from "@/store/auth";
const getToken = () => {
  // Access state directly for non-hook usage.
  return useAuthStore.getState().token;
}
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...init?.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    // Fallback for development when not logged in
    headers['X-Mock-Role'] = 'student';
  }
  const res = await fetch(path, { ...init, headers });
  if (res.status === 401) {
    // Unauthorized, log the user out
    authActions.logout();
    throw new Error('Unauthorized');
  }
  const json = (await res.json()) as ApiResponse<T>
  if (!res.ok) {
    throw new Error(json.error || 'Request failed');
  }
  if (!json.success || json.data === undefined) {
    throw new Error(json.error || 'API request was not successful');
  }
  return json.data
}