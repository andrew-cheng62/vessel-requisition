import { jwtDecode } from "jwt-decode";

export interface TokenPayload {
  sub: string;
  role: string;
  exp: number;
}

export function getCurrentUser() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    return jwtDecode<TokenPayload>(token);
  } catch {
    return null;
  }
}