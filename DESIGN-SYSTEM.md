# UI Design System Rules - STRICT ENFORCEMENT

You are building a **clean, modern, minimal SaaS application** using Next.js + Tailwind + shadcn/ui.

**These rules are mandatory.** Never break them.

### 1. Design Token Rules (Globals.css)

- **Never use hardcoded colors** (`bg-blue-600`, `text-zinc-700`, `border-gray-300`, `#3b82f6`, etc.).
- Always use the **semantic CSS variables** defined in `globals.css`:

  **Allowed:**
  - `bg-background`, `bg-card`, `bg-sidebar`, `bg-muted`, `bg-secondary`, `bg-primary`, `bg-destructive`
  - `text-foreground`, `text-card-foreground`, `text-muted-foreground`, `text-sidebar-foreground`, `text-primary-foreground`
  - `border-border`, `border-input`
  - `focus-visible:ring-ring`
  - Sidebar variants: `bg-sidebar`, `bg-sidebar-primary`, `bg-sidebar-accent`, etc.

- Use proper radius: `rounded-md`, `rounded-lg`, or `rounded-2xl` when needed. Do **not** use arbitrary `rounded-[12px]`.

### 2. Component Usage Rules (SHADCN/UI - STRICT)

You **must** use official shadcn/ui components whenever they exist. Do not build custom versions from scratch unless explicitly instructed.

#### Required shadcn/ui Components & How to Use Them:

- **Layout & Navigation**
  - Use `Sidebar` (or `SidebarProvider`, `SidebarContent`, `SidebarGroup`, `SidebarMenu`, `SidebarMenuItem`, etc.) for any sidebar navigation.
  - Use `NavigationMenu` for top navigation with dropdowns.
  - Use `Sheet` for mobile side menus.

- **Buttons & Actions**
  - Primary actions → `<Button variant="default">` (maps to `--primary`)
  - Secondary actions → `<Button variant="secondary">` or `<Button variant="outline">`
  - Destructive actions → `<Button variant="destructive">`
  - Ghost/ subtle → `<Button variant="ghost">`

- **Feedback & Overlays**
  - Modals / Confirmations → Always use `<AlertDialog>` (not custom div + state)
  - Drawers → Use `<Sheet>`
  - Toasts → Use `useToast()` from shadcn
  - Loading states → Use `<Skeleton>` or the built-in loading component

- **Data Display**
  - Tables → Use `<Table>`, `<TableHeader>`, `<TableBody>`, `<TableRow>`, `<TableCell>` etc.
  - Cards → Use `<Card>`, `<CardHeader>`, `<CardTitle>`, `<CardContent>`
  - Badges → Use `<Badge>`
  - Avatars → Use `<Avatar>`

- **Inputs & Forms**
  - All form inputs → Use `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `Label`
  - Form handling → Prefer `react-hook-form` + `zod` with `<Form>`, `<FormField>`, `<FormItem>`, etc.

- **Navigation & Menus**
  - Dropdown menus → Use `<DropdownMenu>`
  - Command palette / Search → Use `<Command>`
  - Breadcrumbs → Use `<Breadcrumb>`

### 3. Enforcement Rules

- Before creating or modifying any UI component, check if a **shadcn/ui equivalent** already exists.
- If a shadcn component exists for the use case (e.g., AlertDialog, Sidebar, NavigationMenu, etc.), **you must use it**. Do not implement your own version with raw `div`s and Tailwind.
- When using shadcn components, **do not override** their styles with arbitrary Tailwind classes that break the design tokens (especially colors).
- All custom styling on shadcn components must still respect the CSS variables from `globals.css`.

**Examples of Correct Usage:**
- Correct: `<AlertDialog>` for delete confirmations
- Incorrect: Custom `<div className="fixed inset-0 ...">` for modals
- Correct: `<Sidebar>` + `SidebarMenu` for app navigation
- Incorrect: Building your own sidebar with raw `<div>` and `bg-zinc-900`

### 4. General Guidelines

- Keep the UI **clean and minimal** — generous whitespace, clear hierarchy, subtle borders.
- Support **dark mode** perfectly (rely on the variables in `:root` and `.dark`).
- Prioritize **accessibility** — always use proper semantic HTML + shadcn components.
- When in doubt, default to the existing shadcn/ui component library located in `components/ui/`.

---

**Final Instruction:**
Always reference this `DESIGN-SYSTEM.md` file and `globals.css` before writing or editing any frontend code.

If you need to add a new UI pattern, first check if it can be built by composing existing shadcn components. Only then create a new reusable component that follows these rules.

Do you understand and will you strictly follow these design system rules?