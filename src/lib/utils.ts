import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const SUBSCRIPTION_PLANS = [
    {
        id: "free",
        name: "Free",
        description: "Perfect for hobbyists and side projects.",
        price: "$0",
        period: "/mo",
        features: [
            "100k requests/mo",
            "3 team members",
            "Community support",
            "Basic analytics",
        ],
        productId: process.env.NEXT_PUBLIC_FREE_PLAN_ID || "4cba5705-e804-4c1d-8e9b-1eb9ac6a4f04",
    },
    {
        id: "pro",
        name: "Pro",
        description: "The professional choice for scaling startups.",
        price: "$49",
        period: "/mo",
        features: [
            "Unlimited requests",
            "10 team members",
            "Priority support",
            "Advanced monitoring",
            "Custom domains",
        ],
        productId: process.env.NEXT_PUBLIC_PRO_PLAN_ID || "dec7e408-2122-4bd9-aebe-06c9258e4654",
    },
];

export const FREE_PLAN = SUBSCRIPTION_PLANS[0];

export function getPlanByProductId(productId: string) {
    return SUBSCRIPTION_PLANS.find((plan) => plan.productId === productId) || FREE_PLAN;
}
