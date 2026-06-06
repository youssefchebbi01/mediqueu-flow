import type { PlanTier } from "@/hooks/use-current-org";

export interface PlanLimits {
  seats: number;
  appointmentsPerMonth: number;
  locations: number;
  smsPerMonth: number;
  apiAccess: boolean;
  webhooks: boolean;
  advancedAnalytics: boolean;
  sso: boolean;
  customBranding: boolean;
  prioritySupport: boolean;
  dedicatedCSM: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  trial: {
    seats: 5, appointmentsPerMonth: 200, locations: 1, smsPerMonth: 100,
    apiAccess: false, webhooks: false, advancedAnalytics: true,
    sso: false, customBranding: false, prioritySupport: false, dedicatedCSM: false,
  },
  starter: {
    seats: 5, appointmentsPerMonth: 500, locations: 1, smsPerMonth: 250,
    apiAccess: false, webhooks: false, advancedAnalytics: false,
    sso: false, customBranding: false, prioritySupport: false, dedicatedCSM: false,
  },
  growth: {
    seats: 15, appointmentsPerMonth: 5000, locations: 3, smsPerMonth: 2500,
    apiAccess: true, webhooks: true, advancedAnalytics: true,
    sso: false, customBranding: true, prioritySupport: true, dedicatedCSM: false,
  },
  scale: {
    seats: Number.POSITIVE_INFINITY, appointmentsPerMonth: Number.POSITIVE_INFINITY,
    locations: Number.POSITIVE_INFINITY, smsPerMonth: Number.POSITIVE_INFINITY,
    apiAccess: true, webhooks: true, advancedAnalytics: true,
    sso: true, customBranding: true, prioritySupport: true, dedicatedCSM: true,
  },
};

export const PLAN_PRICING: Record<Exclude<PlanTier, "trial">, { name: string; price: number; tagline: string }> = {
  starter:  { name: "Starter",      price: 49,  tagline: "For solo practitioners and brand-new clinics." },
  growth:   { name: "Professional", price: 149, tagline: "For growing clinics with multiple providers." },
  scale:    { name: "Enterprise",   price: 399, tagline: "For multi-location groups and hospital networks." },
};

export function planFeatures(plan: PlanTier) { return PLAN_LIMITS[plan]; }

export function hasFeature(plan: PlanTier | null | undefined, key: keyof PlanLimits): boolean {
  if (!plan) return false;
  const v = PLAN_LIMITS[plan][key];
  return typeof v === "boolean" ? v : v > 0;
}

export function isOverLimit(plan: PlanTier, key: "seats" | "appointmentsPerMonth" | "smsPerMonth" | "locations", used: number) {
  return used >= PLAN_LIMITS[plan][key];
}

export function trialDaysLeft(trialEndsAt: string | null | undefined): number {
  if (!trialEndsAt) return 0;
  return Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000));
}

export function fmtLimit(n: number): string {
  return n === Number.POSITIVE_INFINITY ? "Unlimited" : n.toLocaleString();
}