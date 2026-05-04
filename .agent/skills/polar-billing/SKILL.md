---
name: polar-billing
description: Implement Polar.sh subscriptions, checkout, customer portal, webhooks, plan enforcement, and billing UI using the official @polar-sh/better-auth plugin. This plugin handles customer creation, webhook routing, and checkout sessions — do NOT manually reimplement these. Triggers on any mention of: polar, billing, subscription, checkout, plan, upgrade, downgrade, webhook, payment, invoice, order, customer portal.
---

# Polar.sh Billing Skill (BetterAuth Plugin)

This project uses the **official `@polar-sh/better-auth` plugin** — not a custom Polar SDK integration.
Read this entire skill before writing any billing-related code. Do not fall back to raw Polar SDK patterns.

---

## What the Plugin Handles (Do NOT Reimplement)

The BetterAuth Polar plugin takes over large parts of the billing stack automatically:

| Concern                                   | Who handles it                                   |
| ----------------------------------------- | ------------------------------------------------ |
| Polar customer creation on signup         | Plugin (`createCustomerOnSignUp: true`)          |
| Mapping Polar customer → BetterAuth user  | Plugin (via `externalId = user.id`)              |
| Webhook endpoint + signature verification | Plugin (mounted at `/api/auth/polar`)            |
| Webhook event routing                     | Plugin (`webhooks({ on* handlers })`)            |
| Checkout session creation                 | Plugin (`/api/auth/checkout/:slug`)              |
| Customer portal redirect                  | Plugin (`/api/auth/portal`)                      |
| Client-side checkout/portal methods       | `authClient.checkout()`, `authClient.customer.*` |

You only need to write: plan definitions, plan enforcement, webhook side-effect handlers, and the billing UI.

---

## Project Structure

```
src/
  lib/
    auth.ts                       → BetterAuth server config (Polar plugin lives here)
    auth-client.ts                → BetterAuth client (polarClient added here)
    polar.ts                      → Polar SDK singleton
    billing/
      plans.ts                    → Plan definitions + feature limits
      enforce.ts                  → Plan enforcement helpers for route handlers / actions
  app/
    api/
      auth/
        [...all]/route.ts         → BetterAuth catch-all (handles /api/auth/polar webhook,
                                    /api/auth/checkout/:slug, /api/auth/portal automatically)
    (dashboard)/
      billing/
        page.tsx                  → Billing management UI
        success/page.tsx          → Post-checkout success page
```

> **Note:** There is NO separate `/api/webhooks/polar/route.ts`. The plugin mounts the webhook
> handler inside BetterAuth's catch-all route at `/api/auth/polar`.

---

## 1. Installation

```bash
npm install @polar-sh/better-auth @polar-sh/sdk
```

---

## 2. Environment Variables

```env
# Polar
POLAR_ACCESS_TOKEN=          # Organization Access Token from Polar Dashboard → Settings
POLAR_WEBHOOK_SECRET=        # From Polar Dashboard → Webhooks → your endpoint secret
POLAR_PRO_PRODUCT_ID=        # Product ID from Polar Dashboard
POLAR_TEAM_PRODUCT_ID=       # Product ID from Polar Dashboard

# BetterAuth (already required)
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
NEXT_PUBLIC_APP_URL=
```

Set the webhook endpoint in Polar Dashboard to:
`https://your-domain.com/api/auth/polar`

---

## 3. Polar SDK Singleton

```ts
// src/lib/polar.ts
import { Polar } from "@polar-sh/sdk";

export const polarClient = new Polar({
	accessToken: process.env.POLAR_ACCESS_TOKEN!,
	// Switch to "production" when deploying. Sandbox and production tokens/products are separate.
	server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
});
```

---

## 4. Plan Definitions

```ts
// src/lib/billing/plans.ts

export const PLANS = {
	free: {
		id: "free",
		name: "Free",
		polarProductId: null,
		polarSlug: null,
		limits: {
			aiRequestsPerHour: 20,
			projects: 3,
			apiKeys: 0,
		},
	},
	pro: {
		id: "pro",
		name: "Pro",
		polarProductId: process.env.POLAR_PRO_PRODUCT_ID!,
		polarSlug: "pro", // matches slug in checkout() plugin config
		limits: {
			aiRequestsPerHour: 200,
			projects: 50,
			apiKeys: 5,
		},
	},
	team: {
		id: "team",
		name: "Team",
		polarProductId: process.env.POLAR_TEAM_PRODUCT_ID!,
		polarSlug: "team",
		limits: {
			aiRequestsPerHour: 1000,
			projects: -1, // -1 = unlimited
			apiKeys: 20,
		},
	},
} as const;

export type PlanId = keyof typeof PLANS;

const PLAN_HIERARCHY: PlanId[] = ["free", "pro", "team"];

export function getPlanRank(plan: PlanId): number {
	return PLAN_HIERARCHY.indexOf(plan);
}
```

---

## 5. BetterAuth Server Config with Polar Plugin

```ts
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { polar, checkout, portal, webhooks } from "@polar-sh/better-auth";
import { polarClient } from "@/lib/polar";
import { PLANS } from "@/lib/billing/plans";
// import your DB adapter — see better-auth-nextjs skill references/adapters.md

export const auth = betterAuth({
  database: /* your adapter */,
  emailAndPassword: { enabled: true },

  // Optional: clean up Polar customer when user deletes account
  user: {
    deleteUser: {
      enabled: true,
      afterDelete: async (user) => {
        await polarClient.customers.deleteExternal({ externalId: user.id });
      },
    },
  },

  plugins: [
    polar({
      client: polarClient,

      // Automatically creates a Polar Customer on signup, linked via externalId = user.id
      // No manual customer creation or polarCustomerId DB column needed
      createCustomerOnSignUp: true,

      use: [
        checkout({
          // Define slugs matching PLANS — used in checkout URLs and authClient.checkout({ slug })
          products: [
            { productId: PLANS.pro.polarProductId,  slug: PLANS.pro.polarSlug! },
            { productId: PLANS.team.polarProductId, slug: PLANS.team.polarSlug! },
          ],
          successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?checkout_id={CHECKOUT_ID}`,
          authenticatedUsersOnly: true,
          // Checkout sessions automatically carry the authenticated user as customer
        }),

        portal(),
        // Mounts customer portal redirect at GET /api/auth/portal
        // authClient.customer.portal() triggers this

        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET!,
          // Signature verification is handled automatically by the plugin

          // Granular handlers — add side effects here (emails, DB flags, etc.)
          // The plugin handles customer ↔ user mapping; you handle downstream effects

          onSubscriptionCreated: async (payload) => {
            console.log(`[polar] subscription.created customerId=${payload.customerId}`);
            // e.g. send welcome email, provision resources
          },

          onSubscriptionUpdated: async (payload) => {
            console.log(`[polar] subscription.updated status=${payload.status}`);
            // e.g. notify user of plan change
          },

          onSubscriptionCanceled: async (payload) => {
            console.log(`[polar] subscription.canceled`);
            // e.g. send downgrade email, revoke access in your own tables if needed
          },

          onOrderPaid: async (payload) => {
            console.log(`[polar] order.paid orderId=${payload.id}`);
            // e.g. store invoice record for audit trail, send receipt email
          },

          onCustomerStateChanged: async (payload) => {
            // Catch-all: fires whenever anything about a customer changes
            // Use for syncing plan state into your own DB if you maintain a local copy
            console.log(`[polar] customer.state.changed`);
          },
        }),
      ],
    }),

    nextCookies(), // MUST be the last plugin
  ],
});
```

---

## 6. BetterAuth Client Config with Polar Client Plugin

```ts
// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { polarClient } from "@polar-sh/better-auth/client";

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_APP_URL,
	plugins: [
		polarClient(),
		// Adds authClient.checkout(), authClient.customer.portal(),
		// authClient.customer.state(), authClient.customer.subscriptions.list(), etc.
	],
});

export const { signIn, signOut, signUp, useSession } = authClient;
```

---

## 7. BetterAuth Catch-All Route (No Changes Needed)

The existing BetterAuth route handler automatically mounts all Polar plugin endpoints:

```ts
// src/app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
// This now also handles:
//   POST /api/auth/polar             ← Polar webhook endpoint
//   GET  /api/auth/checkout/:slug    ← Checkout redirect
//   GET  /api/auth/portal            ← Customer portal redirect
```

> Set `https://your-domain.com/api/auth/polar` as the webhook URL in the Polar Dashboard.

---

## 8. Plan Enforcement

```ts
// src/lib/billing/enforce.ts
import { PLANS, getPlanRank, type PlanId } from "./plans";
import { NextResponse } from "next/server";

export function userMeetsPlan(userPlan: PlanId, requiredPlan: PlanId): boolean {
	return getPlanRank(userPlan) >= getPlanRank(requiredPlan);
}

// Use in Route Handlers or Server Actions
export function requirePlan(
	userPlan: string | undefined,
	requiredPlan: PlanId,
) {
	const plan = (userPlan ?? "free") as PlanId;
	const allowed = userMeetsPlan(plan, requiredPlan);
	if (!allowed) {
		return NextResponse.json(
			{
				error: {
					code: "PLAN_REQUIRED",
					message: `This feature requires the ${PLANS[requiredPlan].name} plan`,
					requiredPlan,
					currentPlan: plan,
				},
			},
			{ status: 403 },
		);
	}
	return null; // null = allowed, proceed
}
```

### Checking plan from session

The plugin does NOT automatically write plan info onto the BetterAuth session. To know the user's current plan, use `authClient.customer.state()` on the client, or query Polar directly server-side:

```ts
// Server-side plan check (Route Handler or Server Action)
import { auth } from "@/lib/auth";
import { polarClient } from "@/lib/polar";
import { getPlanRank } from "@/lib/billing/plans";
import { headers } from "next/headers";

export async function getSessionWithPlan() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) return null;

	// Fetch live customer state from Polar
	const customer = await polarClient.customers.getExternal({
		externalId: session.user.id,
	});

	// Derive plan from active subscriptions
	const activeSub = customer.subscriptions?.find(
		(s) => s.status === "active",
	);
	const planId = activeSub?.productId
		? (Object.values(PLANS).find(
				(p) => p.polarProductId === activeSub.productId,
			)?.id ?? "free")
		: "free";

	return { session, planId };
}
```

> **Performance tip:** If you check plan frequently, store `currentPlan` on your own User record and sync it in `onSubscriptionCreated`, `onSubscriptionUpdated`, `onSubscriptionCanceled` webhook handlers. Then read it from the DB instead of calling Polar on every request.

---

## 9. Checkout — Client Usage

```tsx
// In a Client Component
"use client";
import { authClient } from "@/lib/auth-client";

export function UpgradeButton({ plan }: { plan: "pro" | "team" }) {
	const handleUpgrade = async () => {
		// Redirects to Polar-hosted checkout. Authenticated user is auto-attached as customer.
		await authClient.checkout({ slug: plan });
		// OR by product ID:
		// await authClient.checkout({ products: [PLANS[plan].polarProductId] });
	};

	return <button onClick={handleUpgrade}>Upgrade to {plan}</button>;
}
```

Direct URL alternative (no JS needed):

```
/api/auth/checkout/pro    → redirects to Polar checkout for the "pro" slug
/api/auth/portal          → redirects to Polar customer portal
```

---

## 10. Customer State — Client Usage

```tsx
"use client";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";

export function BillingStatus() {
	const [state, setState] = useState<any>(null);

	useEffect(() => {
		authClient.customer.state().then(({ data }) => setState(data));
	}, []);

	if (!state) return <p>Loading...</p>;

	const activeSub = state.subscriptions?.find(
		(s: any) => s.status === "active",
	);
	const plan = activeSub ? "Pro" : "Free";

	return (
		<div>
			<p>Current plan: {plan}</p>
			<button onClick={() => authClient.customer.portal()}>
				Manage Billing
			</button>
		</div>
	);
}
```

---

## 11. Post-Checkout Success Page

```tsx
// src/app/(dashboard)/billing/success/page.tsx
import { redirect } from "next/navigation";

interface Props {
	searchParams: { checkout_id?: string };
}

export default function BillingSuccessPage({ searchParams }: Props) {
	if (!searchParams.checkout_id) redirect("/billing");

	return (
		<div>
			<h1>You&apos;re all set! 🎉</h1>
			<p>
				Your subscription is now active. It may take a few seconds to
				reflect.
			</p>
			<a href="/dashboard">Go to Dashboard</a>
		</div>
	);
}
```

---

## 12. Turbopack / App Router Known Issue

There is a known issue with `@polar-sh/better-auth` client APIs (`authClient.checkout()`, `authClient.customer.*`) in **Next.js App Router with Turbopack** (Next.js 15+).

**Workaround if client APIs fail:** Use direct URL redirects instead:

```ts
// In a Server Action or Route Handler
import { redirect } from "next/navigation";

export async function startCheckout(slug: string) {
	redirect(`/api/auth/checkout/${slug}`);
}

export async function openPortal() {
	redirect("/api/auth/portal");
}
```

Or from a Client Component:

```tsx
<a href="/api/auth/checkout/pro">Upgrade to Pro</a>
<a href="/api/auth/portal">Manage Billing</a>
```

---

## 13. Critical Rules

- **Never create a separate `/api/webhooks/polar` route.** The plugin handles this inside BetterAuth's `[...all]` catch-all. If you add a separate route, webhooks will be processed twice.
- **Never verify webhook signatures manually.** The `webhooks({ secret })` plugin config handles HMAC verification before any handler fires.
- **Never store raw card data.** Polar handles all payment processing; your app only receives event payloads.
- **Sandbox ≠ Production.** Polar access tokens, product IDs, and webhooks are fully separate per environment. Never mix them.
- **`nextCookies()` must be the last plugin** in the `plugins` array — required for Server Action cookie support.
- **Never import `src/lib/auth.ts` in Client Components.** It contains secrets. Use `src/lib/auth-client.ts`.
- **`createCustomerOnSignUp: true` does not guarantee atomicity.** If Polar customer creation fails, the BetterAuth user is still created. Handle this in `onCustomerStateChanged` or add a retry mechanism if you need strict sync.

---

## 14. Local Development

```bash
# Install Polar CLI
npm install -g @polar-sh/cli

# Forward webhooks from Polar sandbox to your local dev server
polar webhooks listen --forward-to localhost:3000/api/auth/polar

# Trigger a test event
polar webhooks trigger subscription.created
```

Alternatively, use the Polar Dashboard sandbox environment to manually trigger events after a test checkout.
