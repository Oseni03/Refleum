import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Plan } from "@prisma/client"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export interface SubscriptionPlan {
    id: Plan;
    name: string;
    description: string;
    price: string;
    period: string;
    features: string[];
    productId: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: Plan.FREE,
        name: "Free",
        description: "Perfect for hobbyists and side projects.",
        price: "$0",
        period: "/mo",
        features: [
            "1 request per minute",
            "3 team members",
            "Community support",
            "Basic analytics",
        ],
        productId: process.env.NEXT_PUBLIC_FREE_PLAN_ID || "4cba5705-e804-4c1d-8e9b-1eb9ac6a4f04",
    },
    {
        id: Plan.STARTER,
        name: "Starter",
        description: "Perfect for growing teams and startups.",
        price: "$19",
        period: "/mo",
        features: [
            "20 requests per minute",
            "10 team members",
            "Priority email support",
            "Standard analytics",
        ],
        productId: process.env.NEXT_PUBLIC_STARTER_PLAN_ID || "starter-plan-id",
    },
    {
        id: Plan.PRO,
        name: "Pro",
        description: "The professional choice for scaling startups.",
        price: "$49",
        period: "/mo",
        features: [
            "60 requests per minute",
            "100 team members",
            "Priority support",
            "Advanced monitoring",
            "Custom domains",
        ],
        productId: process.env.NEXT_PUBLIC_PRO_PLAN_ID || "dec7e408-2122-4bd9-aebe-06c9258e4654",
    },
    {
        id: Plan.ENTERPRISE,
        name: "Enterprise",
        description: "Bespoke solutions for large organizations.",
        price: "Custom",
        period: "",
        features: [
            "1000+ requests per minute",
            "Unlimited team members",
            "Dedicated support",
            "SLA guarantees",
            "Custom integrations",
        ],
        productId: process.env.NEXT_PUBLIC_ENTERPRISE_PLAN_ID || "enterprise-plan-id",
    },
];

export const FREE_PLAN = SUBSCRIPTION_PLANS[0];

export function getPlanByProductId(productId: string): SubscriptionPlan {
    return SUBSCRIPTION_PLANS.find((plan) => plan.productId === productId) || FREE_PLAN;
}

export function getPlanById(planId: Plan): SubscriptionPlan {
    return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId) || FREE_PLAN;
}

export function countWords(text: string | null | undefined): number {
    if (!text) return 0;
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
}
