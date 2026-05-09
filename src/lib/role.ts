import type { Role } from "./mock-data";
const KEY = "mediqueu.role";
const NAME = "mediqueu.name";

export function getRole(): Role | null {
  if (typeof window === "undefined") return null;
  return (localStorage.getItem(KEY) as Role) || null;
}
export function setRole(r: Role, name = "Alex Morgan") {
  localStorage.setItem(KEY, r);
  localStorage.setItem(NAME, name);
}
export function getName(): string {
  if (typeof window === "undefined") return "Guest";
  return localStorage.getItem(NAME) || "Guest";
}
export function logout() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(NAME);
}
export const dashboardPath: Record<Role, string> = {
  patient: "/patient",
  receptionist: "/reception",
  doctor: "/doctor",
  admin: "/admin",
};
