# Neo-Print Poster Grid -- Component System & Prototypes

## Overview

Final version of the Neo-Print Poster Grid admin dashboard design for StoryWeaver. This prototype implements an editorial/magazine-inspired admin interface built with React 18 (CDN + Babel standalone). Every file is self-contained and works by double-clicking in any browser -- no build step, no server required.

## Quick Start

Open `index.html` in any browser (double-click, no server needed).

All showcase and page files follow the same pattern: a single `.html` file containing inline React components, Babel transpilation, and all styles.

## File Structure

```
neo-print-final/
  assets/
    data/                  # JSON fixtures and sample datasets
    styles/                # Shared style tokens (optional CSS)
  components/
    base/                  # 7 base components
      Theme.jsx            # Light/dark toggle wrapper
      Sidebar.jsx          # Navigation rail
      Header.jsx           # Route hero headline
      KpiCard.jsx          # Single stat metric card
      DataTable.jsx        # Tabular data display
      ActivityFeed.jsx     # Chronological event list
      Button.jsx           # Primary and ghost variants
    composed/              # 3 composed components
      DashboardLayout.jsx  # Sidebar + content shell
      StatGrid.jsx         # 4-column KPI row
      TwoColumn.jsx        # 1.4fr + 1fr editorial split
  pages/                   # 10 standalone route pages
    dashboard.html
    orders.html
    queue.html
    campaigns.html
    assets.html
    typography.html
    color-calibration.html
    activity.html
    team.html
    settings.html
  showcase/                # Reference and documentation pages
    component-catalog.html # Live rendered component inventory
    page-gallery.html      # Visual index of all 10 routes
    design-tokens.html     # Token system reference
  index.html               # Prototype entry point
  README.md                # This file
```

## Component System

### Base Components

| Component    | File                           | Description                              | Key Props                         |
| ------------ | ------------------------------ | ---------------------------------------- | --------------------------------- |
| Theme        | components/base/Theme.jsx      | Root wrapper mapping light/dark tokens   | mode, onToggle, children          |
| Sidebar      | components/base/Sidebar.jsx    | Fixed-width navigation rail              | items, active, theme              |
| Header       | components/base/Header.jsx     | Route-aware hero headline                | route, headline, subline, theme   |
| KpiCard      | components/base/KpiCard.jsx    | Single metric stat card                  | label, value, trend, tone, theme  |
| DataTable    | components/base/DataTable.jsx  | Column-driven data table                 | columns, rows, theme              |
| ActivityFeed | components/base/ActivityFeed.jsx | Chronological event list               | events, theme                     |
| Button       | components/base/Button.jsx     | Primary and ghost button variants        | label, variant, onClick           |

### Composed Components

| Component       | File                                    | Description                                  |
| --------------- | --------------------------------------- | -------------------------------------------- |
| DashboardLayout | components/composed/DashboardLayout.jsx | Sidebar (280px) + content grid shell         |
| StatGrid        | components/composed/StatGrid.jsx        | 4-column KPI card row                        |
| TwoColumn       | components/composed/TwoColumn.jsx       | 1.4fr + 1fr editorial priority split         |

## Pages

| Route                    | File                         | Editorial Headline         | Description                                         |
| ------------------------ | ---------------------------- | -------------------------- | --------------------------------------------------- |
| /admin/dashboard         | pages/dashboard.html         | Editorial Command Desk     | Primary KPI + two-column operations view            |
| /admin/orders            | pages/orders.html            | Order Ledger               | Chronological order list with status markers         |
| /admin/queue             | pages/queue.html             | Production Queue           | Operator-first batch and machine allocation view     |
| /admin/campaigns         | pages/campaigns.html         | Campaign Studio            | Launch windows, seasonal grids, headline controls    |
| /admin/assets            | pages/assets.html            | Asset Library              | Visual archive with editorial taxonomy               |
| /admin/typography        | pages/typography.html        | Typography Lab             | Type-scale tuning and print-safe hierarchy checks    |
| /admin/color-calibration | pages/color-calibration.html | Color Calibration          | Theme contrast and profile diagnostics               |
| /admin/activity          | pages/activity.html          | Activity Wire              | Approval and exception event stream                  |
| /admin/team              | pages/team.html              | Team Rosters               | Operator assignment matrix and workload tags         |
| /admin/settings          | pages/settings.html          | System Preferences         | Theme defaults, notifications, integrations          |

## Showcase & Reference

- **Component Catalog:** `showcase/component-catalog.html` -- Live rendered examples of all 10 components in both light and dark themes, with prop tables and usage notes.
- **Page Gallery:** `showcase/page-gallery.html` -- Visual index of all 10 route pages with structural CSS mockups, descriptions, and direct links.
- **Design Tokens:** `showcase/design-tokens.html` -- Full token reference covering color palettes, type scales, spacing primitives, grid definitions, and border conventions.

## Design Tokens

### Colors

**Light theme:**

| Token     | Hex       | CSS Variable |
| --------- | --------- | ------------ |
| Background | `#f5f1ea` | `--bg`       |
| Panel      | `#fffdf9` | `--panel`    |
| Ink        | `#1f1a16` | `--ink`      |
| Muted      | `#6b5d4d` | `--muted`    |
| Accent     | `#ad3f14` | `--accent`   |
| Line       | `#d9cec0` | `--line`     |

**Dark theme:**

| Token     | Hex       | CSS Variable |
| --------- | --------- | ------------ |
| Background | `#141311` | `--bg`       |
| Panel      | `#1d1a17` | `--panel`    |
| Ink        | `#f0e7d8` | `--ink`      |
| Muted      | `#baa98d` | `--muted`    |
| Accent     | `#c46a2d` | `--accent`   |
| Line       | `#473d32` | `--line`     |

### Fonts

| Role     | Family          | Weights   | Usage                          |
| -------- | --------------- | --------- | ------------------------------ |
| Display  | Libre Bodoni    | 500, 700  | Headlines, hero text, headings |
| Body     | IBM Plex Sans   | 400, 500, 700 | UI text, labels, meta      |
| Mono     | IBM Plex Mono   | 400       | Code references, token values  |

### Spacing

| Token        | Value       | Context                |
| ------------ | ----------- | ---------------------- |
| section-pad  | 34px 26px   | Page-level shell       |
| card-pad     | 14-18px     | Card inner content     |
| grid-gap     | 10-16px     | Grid gutters           |
| micro-gap    | 4-8px       | Compact stacking       |

## Adding a New Page

1. Create a new file in `pages/` (e.g., `pages/reports.html`).
2. Copy the HTML boilerplate from any existing page file. Each page includes:
   - Google Fonts link tags for Libre Bodoni and IBM Plex Sans
   - CSS variable declarations in `:root` for the light theme
   - React 18 CDN script tags and Babel standalone
3. Define your page component inside a `<script type="text/babel">` block.
4. Use base components (Sidebar, Header, KpiCard, etc.) by declaring them inline or importing the pattern from the component catalog.
5. Wrap the page with the DashboardLayout pattern: `Sidebar` on the left, content grid on the right.
6. Set the route-specific headline in the Header component.
7. Add a theme toggle by managing a `mode` state and updating CSS variables with `useEffect`.
8. Register the page in the gallery by adding an entry to the `pages` array in `showcase/page-gallery.html`.

## Adding a New Component

1. Create a new file in `components/base/` or `components/composed/`.
2. Follow the token-driven pattern: accept a `theme` prop containing `{ bg, panel, ink, muted, accent, line }`.
3. Use inline styles referencing theme tokens for all colors and borders.
4. Keep font usage consistent: `'Libre Bodoni', serif` for display, `'IBM Plex Sans', sans-serif` for body.
5. Add the component to `showcase/component-catalog.html`:
   - Add a render function in the appropriate section
   - Include a props table with name, type, and description
   - Write a usage note explaining where and how the component fits
6. Test in both light and dark themes by toggling the catalog's theme switch.
