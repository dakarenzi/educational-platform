import { ApiResponse } from "../../shared/types"
import { useAuthStore } from "@/store/auth";
const getToken = () => {
  // Access state directly for non-hook usage.
  // This is safe because the api function is not a React component.
  return useAuthStore.getState().token;
}
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...init?.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(path, { ...init, headers });
  const json = (await res.json()) as ApiResponse<T>
  if (!res.ok) {
    if (res.status === 401) {
      // Unauthorized, log the user out
      useAuthStore.getState().logout();
    }
    throw new Error(json.error || 'Request failed');
  }
  if (!json.success || json.data === undefined) {
    throw new Error(json.error || 'API request was not successful');
  }
  return json.data
}