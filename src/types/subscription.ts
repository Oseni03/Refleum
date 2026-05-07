import { Plan } from "@prisma/client";

export interface SubscriptionDetails {
    id: string;
    organizationId: string;
    polarCustomerId?: string | null;
    polarSubscriptionId?: string | null;
    plan: Plan;
    status: string;
    currentPeriodEnd?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface UsageSummary {
    tailor: number;
    parse: number;
    pdf_export: number;
}

// export interface UsageHistoryResponse {
//     summary: UsageSummary;
//     records: any[];
// }
