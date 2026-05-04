---
name: zustand-manager
description: >
    Type-safe, performant Zustand v5 patterns for this Next.js SaaS.
    Use for ALL global UI state: modals, sidebars, toasts, wizards, drawers,
    command palettes, and any transient client-only state. Covers store creation,
    selectors, persist + SSR hydration, immer, devtools, slices, and testing.
    Triggers on: zustand, store, global state, modal state, sidebar state,
    toast, notification queue, wizard, multi-step, useStore, useShallow,
    persist middleware, UI state.
version: "zustand@5.0.x · Next.js 15 App Router · /src structure"
---

# Zustand Manager Skill

Read this entire skill before writing any store code.
Target version: **Zustand v5** (`zustand@^5.0.0`).

---

## State Decision Matrix

Before reaching for Zustand, pick the right tool for the job.

| State type                              | Correct tool                          | Why NOT Zustand                     |
| --------------------------------------- | ------------------------------------- | ----------------------------------- |
| Modal open/closed                       | ✅ Zustand                            | —                                   |
| Sidebar collapsed                       | ✅ Zustand                            | —                                   |
| Multi-step wizard step + collected data | ✅ Zustand                            | —                                   |
| Toast / notification queue              | ✅ Zustand                            | —                                   |
| Command palette open state              | ✅ Zustand                            | —                                   |
| Drawer + its payload                    | ✅ Zustand                            | —                                   |
| Theme preference (persisted)            | ✅ Zustand + persist                  | —                                   |
| Current user / session                  | ❌ BetterAuth (`useSession`)          | Already managed, would duplicate    |
| Subscription / plan status              | ❌ `authClient.customer.state()`      | Live data, needs freshness          |
| Any data from the DB                    | ❌ Server Components / TanStack Query | Goes stale, no cache invalidation   |
| Form field values                       | ❌ `react-hook-form`                  | Built for this, includes validation |
| URL-driven state (tabs, filters)        | ❌ `nuqs` / `useSearchParams`         | Should survive refresh / sharing    |
| Component-local toggle                  | ❌ `useState`                         | No other component needs it         |

**Rule:** If the state needs to be fresh, shareable via URL, or lives on the server — it does not belong in Zustand.

---

## Installation

```bash
npm install zustand
# Immer middleware (optional, for deeply nested state mutations)
npm install immer
```

---

## File Structure

```
src/
  stores/
    ui-store.ts              → Sidebar, header, layout toggles
    modal-store.ts           → Centralised modal management
    toast-store.ts           → Toast / notification queue
    theme-persistent.ts      → Theme preference (persisted to localStorage)
    onboarding-store.ts      → Multi-step wizard (reset when done)
    command-palette-store.ts → Command palette open state + query
    editor-store.ts          → Complex nested state (uses immer)
    slices/                  → Slice files when a store gets large
      sidebar-slice.ts
      command-palette-slice.ts
```

Naming rules:

- Files end in `-store.ts` for ephemeral stores
- Files end in `-persistent.ts` for stores that use the `persist` middleware
- All stores live in `src/stores/` only — never colocated with components
- Export only the hook (`useXxxStore`), never the store instance itself

---

## 1. TypeScript Base Pattern

Always use the **curried double-parentheses** form `create<T>()()`.
Single parentheses `create<T>(...)` breaks middleware type inference in v5.

```ts
// src/stores/ui-store.ts
import { create } from "zustand";

// Separate interfaces for state (data) and actions (methods)
// This makes selectors, testing, and documentation much cleaner
interface UIState {
	isSidebarOpen: boolean;
	isMobileNavOpen: boolean;
	activePanel: "main" | "settings" | "notifications" | null;
}

interface UIActions {
	toggleSidebar: () => void;
	setSidebarOpen: (open: boolean) => void;
	toggleMobileNav: () => void;
	setActivePanel: (panel: UIState["activePanel"]) => void;
	reset: () => void;
}

type UIStore = UIState & UIActions;

// Initial state extracted so reset() has a single source of truth
const initialState: UIState = {
	isSidebarOpen: true,
	isMobileNavOpen: false,
	activePanel: null,
};

export const useUIStore = create<UIStore>()((set) => ({
	...initialState,

	toggleSidebar: () =>
		set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

	setSidebarOpen: (open) => set({ isSidebarOpen: open }),

	toggleMobileNav: () =>
		set((state) => ({ isMobileNavOpen: !state.isMobileNavOpen })),

	setActivePanel: (panel) => set({ activePanel: panel }),

	reset: () => set(initialState),
}));

// Export TypeScript type for use in selectors / tests
export type { UIStore };
```

---

## 2. Selector Patterns (Critical for Performance)

In Zustand v5, returning a new object reference from a selector without `useShallow`
causes an **infinite render loop** — this was a silent bug in v4 that v5 now makes explicit
with "Maximum update depth exceeded".

### Import path

```ts
import { useShallow } from "zustand/shallow";
// NOT "zustand/react/shallow" — that path is inconsistent across versions
```

### Rules by return type

```ts
"use client";
import { useShallow } from "zustand/shallow";
import { useUIStore } from "@/stores/ui-store";

// ✅ Single primitive — no useShallow needed
const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);

// ✅ Single action — functions are stable references, no useShallow needed
const toggleSidebar = useUIStore((state) => state.toggleSidebar);

// ✅ Multiple values as object — ALWAYS use useShallow
const { isSidebarOpen, activePanel } = useUIStore(
	useShallow((state) => ({
		isSidebarOpen: state.isSidebarOpen,
		activePanel: state.activePanel,
	})),
);

// ✅ Multiple values as array — useShallow works here too
const [isSidebarOpen, isMobileNavOpen] = useUIStore(
	useShallow((state) => [state.isSidebarOpen, state.isMobileNavOpen]),
);

// ❌ NEVER — creates a new object on every render → infinite loop in v5
const { isSidebarOpen } = useUIStore((state) => ({
	isSidebarOpen: state.isSidebarOpen,
}));
```

### Computed / derived selectors

Define computed selectors as pure functions outside the store — keep the store lean.

```ts
// Defined outside the store — reusable, easily testable
export const selectHasOpenPanel = (state: UIStore) =>
	state.activePanel !== null;

// In component — returns a primitive so no useShallow needed
const hasOpenPanel = useUIStore(selectHasOpenPanel);
```

---

## 3. Modal Store (Centralised Pattern)

Rather than a boolean per modal, use a single registry. This prevents modal state
from scattering across many separate stores and allows typed payloads per modal.

```ts
// src/stores/modal-store.ts
import { create } from "zustand";
import { useShallow } from "zustand/shallow";

// Add every modal ID in the app here — autocomplete prevents typos
type ModalId =
	| "create-project"
	| "delete-confirm"
	| "invite-member"
	| "upgrade-plan"
	| "edit-profile";

// Typed payload per modal — add entries as needed
type ModalPayloads = {
	"delete-confirm": { resourceId: string; resourceType: string };
	"invite-member": { organizationId: string };
	"upgrade-plan": { currentPlan: string };
};

interface ModalState {
	openModals: Set<ModalId>;
	payload: Partial<ModalPayloads>;
}

interface ModalActions {
	openModal: <T extends ModalId>(
		id: T,
		payload?: T extends keyof ModalPayloads ? ModalPayloads[T] : never,
	) => void;
	closeModal: (id: ModalId) => void;
	closeAllModals: () => void;
}

type ModalStore = ModalState & ModalActions;

export const useModalStore = create<ModalStore>()((set) => ({
	openModals: new Set(),
	payload: {},

	openModal: (id, payload) =>
		set((state) => ({
			openModals: new Set([...state.openModals, id]),
			payload: payload
				? { ...state.payload, [id]: payload }
				: state.payload,
		})),

	closeModal: (id) =>
		set((state) => {
			const next = new Set(state.openModals);
			next.delete(id);
			const { [id]: _, ...restPayload } = state.payload as Record<
				string,
				unknown
			>;
			return {
				openModals: next,
				payload: restPayload as Partial<ModalPayloads>,
			};
		}),

	closeAllModals: () => set({ openModals: new Set(), payload: {} }),
}));

// Convenience hook — avoids repeating useShallow in every modal component
export function useModal<T extends ModalId>(id: T) {
	return useModalStore(
		useShallow((state) => ({
			isOpen: state.openModals.has(id),
			payload: state.payload[
				id as keyof typeof state.payload
			] as T extends keyof ModalPayloads
				? ModalPayloads[T] | undefined
				: never,
			open: (
				payload?: T extends keyof ModalPayloads
					? ModalPayloads[T]
					: never,
			) => state.openModal(id, payload),
			close: () => state.closeModal(id),
		})),
	);
}
```

```tsx
// Usage — trigger
"use client";
import { useModal } from "@/stores/modal-store";

export function DeleteButton({ resourceId }: { resourceId: string }) {
	const { open } = useModal("delete-confirm");
	return (
		<button onClick={() => open({ resourceId, resourceType: "project" })}>
			Delete
		</button>
	);
}

// Usage — the modal component itself
export function DeleteConfirmModal() {
	const { isOpen, payload, close } = useModal("delete-confirm");
	if (!isOpen || !payload) return null;
	// payload.resourceId and payload.resourceType are fully typed ✅
}
```

---

## 4. Toast / Notification Queue

```ts
// src/stores/toast-store.ts
import { create } from "zustand";

type ToastVariant = "success" | "error" | "warning" | "info";

interface Toast {
	id: string;
	message: string;
	variant: ToastVariant;
	durationMs?: number; // undefined = stays until manually dismissed
}

interface ToastState {
	toasts: Toast[];
}

interface ToastActions {
	addToast: (toast: Omit<Toast, "id">) => void;
	removeToast: (id: string) => void;
	clearAll: () => void;
}

type ToastStore = ToastState & ToastActions;

export const useToastStore = create<ToastStore>()((set) => ({
	toasts: [],

	addToast: (toast) => {
		const id = crypto.randomUUID();
		set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));

		if (toast.durationMs) {
			setTimeout(() => {
				set((state) => ({
					toasts: state.toasts.filter((t) => t.id !== id),
				}));
			}, toast.durationMs);
		}
	},

	removeToast: (id) =>
		set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

	clearAll: () => set({ toasts: [] }),
}));

// Singleton helper — for use OUTSIDE of components (event handlers, callbacks)
// This is one of the few legitimate uses of .getState()
export const toast = {
	success: (message: string, durationMs = 4000) =>
		useToastStore
			.getState()
			.addToast({ message, variant: "success", durationMs }),
	error: (message: string, durationMs = 6000) =>
		useToastStore
			.getState()
			.addToast({ message, variant: "error", durationMs }),
	warning: (message: string, durationMs = 5000) =>
		useToastStore
			.getState()
			.addToast({ message, variant: "warning", durationMs }),
	info: (message: string, durationMs = 4000) =>
		useToastStore
			.getState()
			.addToast({ message, variant: "info", durationMs }),
};
```

```ts
// Usage anywhere in client code (event handler, Server Action callback, etc.)
import { toast } from "@/stores/toast-store";

async function handleSave() {
	try {
		await saveProject();
		toast.success("Project saved!");
	} catch {
		toast.error("Failed to save. Please try again.");
	}
}
```

---

## 5. Persist Middleware + SSR Hydration

`persist` reads from `localStorage`, which doesn't exist during SSR.
Without the hydration guard, you get a client/server mismatch on first render.

```ts
// src/stores/theme-persistent.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Theme = "light" | "dark" | "system";

interface ThemeState {
	theme: Theme;
	_hasHydrated: boolean; // SSR guard — underscore signals internal/private field
}

interface ThemeActions {
	setTheme: (theme: Theme) => void;
	_setHasHydrated: (val: boolean) => void;
}

type ThemeStore = ThemeState & ThemeActions;

export const useThemeStore = create<ThemeStore>()(
	persist(
		(set) => ({
			theme: "system",
			_hasHydrated: false,
			setTheme: (theme) => set({ theme }),
			_setHasHydrated: (val) => set({ _hasHydrated: val }),
		}),
		{
			name: "theme-v1", // Version suffix — bump to "theme-v2" if shape changes
			storage: createJSONStorage(() => localStorage),

			// Only persist user-facing fields, not internal SSR flags
			partialize: (state) => ({ theme: state.theme }),

			onRehydrateStorage: () => (state) => {
				state?._setHasHydrated(true);
			},
		},
	),
);
```

```tsx
// src/components/providers/hydration-guard.tsx
// Wrap any component that reads from a persisted store
"use client";
import { useThemeStore } from "@/stores/theme-persistent";

export function ThemeHydrationGuard({
	children,
}: {
	children: React.ReactNode;
}) {
	const hasHydrated = useThemeStore((state) => state._hasHydrated);
	// Render nothing until localStorage has been read
	// Ensures server HTML and first client render match exactly
	if (!hasHydrated) return null;
	return <>{children}</>;
}
```

```tsx
// Theme toggle — only mounted after hydration guard passes
"use client";
import { useThemeStore } from "@/stores/theme-persistent";

export function ThemeToggle() {
	const theme = useThemeStore((state) => state.theme);
	const setTheme = useThemeStore((state) => state.setTheme);
	return (
		<button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
			{theme === "dark" ? "Light mode" : "Dark mode"}
		</button>
	);
}
```

### Persist versioning

```ts
// When you change the shape of a persisted store, use migrate() to avoid
// wiping existing users' localStorage data:
persist(
	(set) => ({
		theme: "system",
		accentColor: "blue",
		_hasHydrated: false /* ... */,
	}),
	{
		name: "theme-v2",
		version: 2,
		migrate: (persistedState: unknown, version) => {
			if (version === 1) {
				// v1 didn't have accentColor — supply a default
				return { ...(persistedState as object), accentColor: "blue" };
			}
			return persistedState;
		},
		partialize: (state) => ({
			theme: state.theme,
			accentColor: state.accentColor,
		}),
		onRehydrateStorage: () => (state) => {
			state?._setHasHydrated(true);
		},
	},
);
```

---

## 6. Multi-Step Wizard Pattern

```ts
// src/stores/onboarding-store.ts
import { create } from "zustand";

type OnboardingStep = "profile" | "team" | "billing" | "done";

interface OnboardingData {
	profile: { name: string; role: string; avatarUrl?: string } | null;
	team: { teamName: string; size: string } | null;
	billing: { planId: string } | null;
}

interface OnboardingState {
	currentStep: OnboardingStep;
	completedSteps: Set<OnboardingStep>;
	data: OnboardingData;
}

interface OnboardingActions {
	goToStep: (step: OnboardingStep) => void;
	completeStep: (step: OnboardingStep) => void;
	setStepData: <K extends keyof OnboardingData>(
		step: K,
		data: OnboardingData[K],
	) => void;
	reset: () => void;
}

type OnboardingStore = OnboardingState & OnboardingActions;

const initialState: OnboardingState = {
	currentStep: "profile",
	completedSteps: new Set(),
	data: { profile: null, team: null, billing: null },
};

export const useOnboardingStore = create<OnboardingStore>()((set) => ({
	...initialState,

	goToStep: (step) => set({ currentStep: step }),

	completeStep: (step) =>
		set((state) => ({
			completedSteps: new Set([...state.completedSteps, step]),
		})),

	setStepData: (step, data) =>
		set((state) => ({ data: { ...state.data, [step]: data } })),

	reset: () => set(initialState),
}));

// Derived selectors
const STEP_ORDER: OnboardingStep[] = ["profile", "team", "billing", "done"];

export const selectIsStepComplete =
	(step: OnboardingStep) => (state: OnboardingStore) =>
		state.completedSteps.has(step);

export const selectCanNavigateToStep =
	(step: OnboardingStep) => (state: OnboardingStore) => {
		const targetIdx = STEP_ORDER.indexOf(step);
		if (targetIdx === 0) return true;
		return state.completedSteps.has(STEP_ORDER[targetIdx - 1]);
	};

export const selectProgressPercent = (state: OnboardingStore) =>
	Math.round((state.completedSteps.size / (STEP_ORDER.length - 1)) * 100);
```

---

## 7. Immer Middleware (for Deeply Nested State)

Use Immer when state has nested objects that are painful to update immutably.
Don't use it for flat stores — it adds unnecessary runtime overhead.

```ts
// src/stores/editor-store.ts
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface Block {
	id: string;
	type: "text" | "image" | "code";
	content: string;
	meta: Record<string, unknown>;
}

interface EditorState {
	blocks: Block[];
	selectedBlockId: string | null;
	isDirty: boolean;
}

interface EditorActions {
	addBlock: (block: Block) => void;
	updateBlockContent: (id: string, content: string) => void;
	updateBlockMeta: (id: string, key: string, value: unknown) => void;
	removeBlock: (id: string) => void;
	reorderBlocks: (fromIdx: number, toIdx: number) => void;
	selectBlock: (id: string | null) => void;
	markClean: () => void;
}

type EditorStore = EditorState & EditorActions;

export const useEditorStore = create<EditorStore>()(
	immer((set) => ({
		blocks: [],
		selectedBlockId: null,
		isDirty: false,

		// With immer: mutate state.x directly — immer handles immutability
		addBlock: (block) =>
			set((state) => {
				state.blocks.push(block);
				state.isDirty = true;
			}),

		updateBlockContent: (id, content) =>
			set((state) => {
				const block = state.blocks.find((b) => b.id === id);
				if (block) {
					block.content = content;
					state.isDirty = true;
				}
			}),

		updateBlockMeta: (id, key, value) =>
			set((state) => {
				const block = state.blocks.find((b) => b.id === id);
				if (block) {
					block.meta[key] = value;
					state.isDirty = true;
				}
			}),

		removeBlock: (id) =>
			set((state) => {
				state.blocks = state.blocks.filter((b) => b.id !== id);
				state.isDirty = true;
			}),

		reorderBlocks: (fromIdx, toIdx) =>
			set((state) => {
				const [block] = state.blocks.splice(fromIdx, 1);
				state.blocks.splice(toIdx, 0, block);
				state.isDirty = true;
			}),

		selectBlock: (id) =>
			set((state) => {
				state.selectedBlockId = id;
			}),

		markClean: () =>
			set((state) => {
				state.isDirty = false;
			}),
	})),
);
```

---

## 8. Devtools Middleware

Add devtools to stores you're actively debugging. The middleware stack ordering matters:
`devtools` wraps the outside, `persist` goes inside it, `immer` goes innermost.

```ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// Stack order: devtools > persist > immer > store function
export const useComplexStore = create<ComplexStore>()(
	devtools(
		persist(
			immer((set) => ({
				// store definition
			})),
			{ name: "complex-v1" },
		),
		{
			name: "ComplexStore", // Label in Redux DevTools
			enabled: process.env.NODE_ENV === "development",
		},
	),
);
```

Label actions for better DevTools readability:

```ts
set({ isSidebarOpen: true }, false, "sidebar/open");
//                           ↑        ↑
//                      replace?    action label shown in DevTools
```

---

## 9. Slices Pattern (for Large Stores)

Split a large store into typed `StateCreator` slices and compose them.
Use this when a single store grows past ~5 distinct concerns.

```ts
// src/stores/slices/sidebar-slice.ts
import type { StateCreator } from "zustand";

export interface SidebarSlice {
	isSidebarOpen: boolean;
	toggleSidebar: () => void;
	setSidebarOpen: (open: boolean) => void;
}

export const createSidebarSlice: StateCreator<
	SidebarSlice,
	[],
	[],
	SidebarSlice
> = (set) => ({
	isSidebarOpen: true,
	toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
	setSidebarOpen: (open) => set({ isSidebarOpen: open }),
});
```

```ts
// src/stores/slices/command-palette-slice.ts
import type { StateCreator } from "zustand";

export interface CommandPaletteSlice {
	isCommandPaletteOpen: boolean;
	commandQuery: string;
	openCommandPalette: () => void;
	closeCommandPalette: () => void;
	setCommandQuery: (query: string) => void;
}

export const createCommandPaletteSlice: StateCreator<
	CommandPaletteSlice,
	[],
	[],
	CommandPaletteSlice
> = (set) => ({
	isCommandPaletteOpen: false,
	commandQuery: "",
	openCommandPalette: () =>
		set({ isCommandPaletteOpen: true, commandQuery: "" }),
	closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
	setCommandQuery: (query) => set({ commandQuery: query }),
});
```

```ts
// src/stores/app-store.ts — compose all slices
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { createSidebarSlice, type SidebarSlice } from "./slices/sidebar-slice";
import {
	createCommandPaletteSlice,
	type CommandPaletteSlice,
} from "./slices/command-palette-slice";

type AppStore = SidebarSlice & CommandPaletteSlice;

export const useAppStore = create<AppStore>()(
	devtools(
		(...args) => ({
			...createSidebarSlice(...args),
			...createCommandPaletteSlice(...args),
		}),
		{ name: "AppStore", enabled: process.env.NODE_ENV === "development" },
	),
);
```

---

## 10. Using `get` — Reading State Inside Actions

Use the `get` argument when an action needs to read current state to compute next state.

```ts
export const useUIStore = create<UIStore>()((set, get) => ({
	// ...

	// Only open panel if sidebar is already expanded
	openPanelSafe: (panel: UIState["activePanel"]) => {
		if (get().isSidebarOpen) {
			set({ activePanel: panel }, false, "panel/open");
		}
	},

	// Toggle sidebar and close the active panel when collapsing
	toggleSidebar: () => {
		const isCurrentlyOpen = get().isSidebarOpen;
		set(
			{
				isSidebarOpen: !isCurrentlyOpen,
				activePanel: isCurrentlyOpen ? null : get().activePanel,
			},
			false,
			"sidebar/toggle",
		);
	},
}));
```

---

## 11. Reading Store State Outside of Components

Two legitimate uses of `.getState()` — both outside of React render:

```ts
// ✅ In event handlers / callbacks (not during render)
import { toast } from "@/stores/toast-store";

async function submitForm(data: FormData) {
	// toast helper already calls .getState() internally
	toast.success("Form submitted!");
}

// ✅ In vanilla subscriptions (outside components, e.g. in global listeners)
import { useUIStore } from "@/stores/ui-store";

const unsub = useUIStore.subscribe(
	(state) => state.isSidebarOpen,
	(isOpen) => {
		// Side effect that doesn't live in React (e.g. updating a CSS class on body)
		document.body.classList.toggle("sidebar-open", isOpen);
	},
);
// Call unsub() to clean up

// ❌ NEVER call .getState() inside a component — you won't get re-renders
function MyComponent() {
	// ❌ Won't re-render when state changes
	const isOpen = useUIStore.getState().isSidebarOpen;

	// ✅ Use the hook
	const isOpen = useUIStore((state) => state.isSidebarOpen);
}
```

---

## 12. Auto-Selector Helpers (Advanced)

Remove selector boilerplate for simple field access with a typed utility:

```ts
// src/stores/create-selectors.ts
import type { StoreApi, UseBoundStore } from "zustand";

type WithSelectors<S> = S extends { getState: () => infer T }
	? S & { use: { [K in keyof T]: () => T[K] } }
	: never;

export function createSelectors<S extends UseBoundStore<StoreApi<object>>>(
	store: S,
) {
	const s = store as WithSelectors<typeof store>;
	s.use = {} as any;
	for (const k of Object.keys(store.getState())) {
		(s.use as any)[k] = () => store((st: any) => st[k]);
	}
	return s;
}
```

```ts
// src/stores/ui-store.ts
import { createSelectors } from "./create-selectors";

const useUIStoreBase = create<UIStore>()(/* ... */);
export const useUIStore = createSelectors(useUIStoreBase);

// In components — fully type-safe, no selector boilerplate
const isOpen = useUIStore.use.isSidebarOpen();
const toggle = useUIStore.use.toggleSidebar();
```

---

## 13. Testing Stores

Stores are pure functions — test the logic directly without rendering components.

```ts
// src/stores/__tests__/toast-store.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useToastStore } from "@/stores/toast-store";

describe("useToastStore", () => {
	// Reset store between tests to prevent state leakage
	beforeEach(() => {
		useToastStore.setState({ toasts: [] });
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("adds a toast with a generated ID", () => {
		const { addToast } = useToastStore.getState();
		addToast({ message: "Hello", variant: "success" });
		const { toasts } = useToastStore.getState();
		expect(toasts).toHaveLength(1);
		expect(toasts[0].message).toBe("Hello");
		expect(toasts[0].id).toBeDefined();
	});

	it("auto-dismisses after durationMs", () => {
		const { addToast } = useToastStore.getState();
		addToast({ message: "Bye", variant: "info", durationMs: 3000 });
		expect(useToastStore.getState().toasts).toHaveLength(1);
		vi.advanceTimersByTime(3000);
		expect(useToastStore.getState().toasts).toHaveLength(0);
	});

	it("removes a specific toast by ID", () => {
		const { addToast, removeToast } = useToastStore.getState();
		addToast({ message: "A", variant: "success" });
		addToast({ message: "B", variant: "error" });
		const id = useToastStore.getState().toasts[0].id;
		removeToast(id);
		const remaining = useToastStore.getState().toasts;
		expect(remaining).toHaveLength(1);
		expect(remaining[0].message).toBe("B");
	});

	it("clears all toasts", () => {
		const { addToast, clearAll } = useToastStore.getState();
		addToast({ message: "A", variant: "success" });
		addToast({ message: "B", variant: "error" });
		clearAll();
		expect(useToastStore.getState().toasts).toHaveLength(0);
	});
});

// Testing a wizard store
import { useOnboardingStore } from "@/stores/onboarding-store";

describe("useOnboardingStore", () => {
	beforeEach(() => useOnboardingStore.getState().reset());

	it("marks a step complete", () => {
		useOnboardingStore.getState().completeStep("profile");
		expect(
			useOnboardingStore.getState().completedSteps.has("profile"),
		).toBe(true);
	});

	it("stores step data", () => {
		useOnboardingStore.getState().setStepData("profile", {
			name: "Alice",
			role: "engineer",
		});
		expect(useOnboardingStore.getState().data.profile?.name).toBe("Alice");
	});

	it("resets to initial state", () => {
		useOnboardingStore.getState().completeStep("profile");
		useOnboardingStore.getState().reset();
		expect(useOnboardingStore.getState().completedSteps.size).toBe(0);
		expect(useOnboardingStore.getState().currentStep).toBe("profile");
	});
});
```

---

## Hard Rules (Non-Negotiable)

### TypeScript

- **Always use `create<T>()()`** (double parentheses). Single parentheses break middleware inference in v5.
- **Always separate `State` and `Actions` interfaces**. Combine them as `type Store = State & Actions`.
- **Always extract `initialState`** as a typed const — `reset()` must reference it, not duplicate it.

### Selectors

- **Always use `useShallow`** when the selector returns an object or array.
- **Always import `useShallow` from `"zustand/shallow"`** — not `"zustand/react/shallow"`.
- **Never return `{ key: state.key }` from a selector without `useShallow`** — this is an infinite loop in v5.
- **Define computed selectors outside the store** as pure `(state: Store) => value` functions.

### Persistence

- **Always use `partialize`** to exclude `_hasHydrated` and other internal flags from localStorage.
- **Always version persist `name`** with a suffix (`theme-v1`). Bump on shape changes. Use `migrate` for in-place upgrades.
- **Always guard hydration** with `_hasHydrated`. Render nothing (or a skeleton) until `true`.

### Boundaries

- **Never store server data** (users, subscriptions, DB lists) in Zustand.
- **Never call `useXxxStore.getState()`** inside a component render function — use the hook.
- **Never export the store instance** — export only the hook (`useXxxStore`).
- **Never use Zustand for form state** — use `react-hook-form`.
- **Never use Zustand for URL-driven state** (tabs, filters) — use `nuqs` or `useSearchParams`.
- **All store files live in `src/stores/`** only — never colocated in component folders.
- **Ephemeral stores end in `-store.ts`**, persisted stores end in `-persistent.ts`.
- **Always provide `reset()`** on wizard and multi-step flow stores.
- **Middleware stack order:** `devtools` > `persist` > `immer` > store function.
