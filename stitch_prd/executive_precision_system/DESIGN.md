---
name: Executive Precision System
colors:
  surface: '#fcf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fcf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f5'
  surface-container: '#f0edef'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e4e2e4'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45464d'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#271901'
  on-tertiary-container: '#98805d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#fcf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e4'
  success: '#22C55E'
  warning: '#F59E0B'
  danger: '#EF4444'
  neutral-dim: '#94A3B8'
  surface-finance: '#F8FAFC'
  border-subtle: '#E2E8F0'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
  badge-cap:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  grid-gutter: 16px
  container-margin: 24px
  cell-gap: 4px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is engineered for **B2B Goal Management**, targeting executives, department heads, and analysts who require a "single source of truth." The brand personality is **Professional, Data-Driven, and Transparent**, moving away from the clutter of traditional spreadsheets toward a high-performance cockpit experience.

The chosen style is **Corporate / Modern** with elements of **Minimalism**. It prioritizes high information density and cognitive "control." The interface remains unobtrusive to allow data—specifically the status-driven color logic—to lead the user's attention. Visual weight is used to establish a clear hierarchy, ensuring that critical blockers (red states) are immediately distinguishable from steady progress (green states). The aesthetic is sharp, structured, and focused on functional utility.

## Colors

The palette is anchored by a deep **Primary Blue (#0F172A)**, providing a grounded, authoritative feel for navigation and primary actions. The core functional power of the system lies in its semantic status colors:

- **Success (Green):** Indicates completed goals or healthy progress (HealthScore > 1).
- **Warning (Amber):** Signals caution or in-progress items that require monitoring (0.7 ≤ HealthScore < 1).
- **Danger (Red):** Demands immediate attention for stalled goals or critical blockers (HealthScore < 0.7).
- **Neutral (Grays):** Used for secondary text, metadata, and borders to maintain a clean, non-distracting environment.

A specialized **Surface Finance** color is used as a background token for read-only states, signaling a "Restricted View" for specific personas without using heavy overlays.

## Typography

The system utilizes **Inter** for its exceptional legibility in data-dense environments. For mathematical outputs, KPI formulas, and progress percentages, **JetBrains Mono** is employed to ensure character alignment and a distinct "technical" feel for metrics.

### Hierarchy Scaling
- **Headings:** Use tight letter spacing and bold weights to anchor sections of the 6-pillar dashboard.
- **Data Points:** KPI values and percentages use the `label-mono` token to distinguish calculated results from descriptive text.
- **Labels:** Small caps with increased letter spacing (`badge-cap`) are used for status badges and high-contrast alerts to ensure they remain legible at small sizes.

## Layout & Spacing

This design system uses a **Fixed Grid** philosophy for dashboarding and a **Fluid Content** model for data tables. 

### Key Layout Rules:
- **Weekly Tracking Grid:** A specialized horizontal layout accommodating 52-53 weeks. Each cell is a fixed square with a `cell-gap` of 4px. On mobile, this reflows into a 4-column compact grid.
- **The 6 Pillars:** Desktop views utilize a 12-column grid where pillars are grouped in 2-column or 4-column spans depending on the metric density.
- **Sidebar:** A fixed 240px left-navigation bar ensures constant access to the "Pillars."
- **Information Density:** Vertical spacing is compressed (`stack-sm`) for data lists to maximize the "above-the-fold" visibility of key metrics.

## Elevation & Depth

To maintain a "Control Center" aesthetic, the system avoids heavy shadows, favoring **Tonal Layers** and **Low-Contrast Outlines**.

- **Level 0 (Background):** Solid `#F8FAFC` or `#FFFFFF`.
- **Level 1 (Cards/Surface):** White background with a 1px `#E2E8F0` border. No shadow.
- **Level 2 (Modals/Overlays):** Used for weekly status updates. Features a soft ambient shadow (10% opacity) and a background blur to maintain context without visual noise.
- **Read-only State:** Finance persona views utilize a subtle `#F1F5F9` tint across interactive containers to signal non-interactivity without "graying out" critical data.

## Shapes

The shape language is **Soft (Level 1)**. 

- **Standard Elements:** Buttons, input fields, and cards use a 0.25rem (4px) radius. This provides a professional, modern look that remains disciplined and efficient for grid layouts.
- **Data Cells:** The 53-week tracking cells use a smaller 2px radius to maximize the color-fill area while softening the grid's texture.
- **Badges:** Success/Warning/Error badges use a `rounded-lg` (8px) or pill shape to differentiate them from functional UI buttons.

## Components

### Data Grids & Cells
The 53-week tracking grid is the core component. Cells must be strictly color-coded based on the HealthScore. Inactive weeks (outside goal range) use `neutral-dim`.

### Status Badges
High-contrast indicators for "🏆 Rewards" or "⚠️ Alerts." They should use the `badge-cap` typography and a background tint derived from the status colors (e.g., 15% opacity of the status hex).

### Professional Data Grids
Tables must support "sticky" first columns for Goal Names. Row height is compact (32px or 40px) to support high information density. KPI columns use `label-mono`.

### Sidebars
A persistent, dark-themed sidebar using `primary_color_hex`. It serves as the primary navigation for the 6 Pillars of the business.

### Action Buttons
- **Primary:** Solid `#0F172A` with white text.
- **Secondary:** Outlined with `border-subtle`.
- **Calculators:** Real-time KPI inputs do not have submit buttons; they feature a subtle "Calculating..." pulse animation in the border-bottom when active.

### Cards
Metric cards should feature a "Mini Progress Bar" at the bottom, showing *Actual* vs *Expected* progress using two-tone status colors.