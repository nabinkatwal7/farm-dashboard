# FieldPilot Design Guidelines

## Product posture

FieldPilot should feel calm, capable, and trustworthy.

- Calm: low visual noise, strong spacing, clear hierarchy.
- Capable: interfaces should show depth without feeling dense or cryptic.
- Trustworthy: copy, data presentation, and interaction states should feel deliberate and current.

The public-facing experience should feel bright, editorial, and easy to browse.
The management portal should feel efficient, steady, and work-focused.

## Visual direction

- Prefer light surfaces, soft shadows, and clear borders.
- Do not use gradients.
- Avoid decorative backgrounds that compete with content.
- Use imagery that shows real farms, products, land, livestock, or operations.
- Keep cards restrained: 8px to 22px radii depending on context, never inflated or playful.

## Color usage

- Base background: warm light neutral.
- Surface background: white or near-white.
- Primary text: dark neutral green-charcoal.
- Secondary text: muted olive-gray.
- Accent green is the primary action color.
- Use blue, amber, purple, and red as supporting functional accents only.

Color should communicate state and emphasis, not decoration.

## Typography

- Headlines should be concise and confident.
- Use larger type only where the page truly needs a primary message.
- Dashboard and form surfaces should use tighter, smaller headings.
- Avoid robotic phrasing, filler nouns, and repetitive sentence patterns.
- Uppercase micro-labels are acceptable for section kickers and metadata only.

## Copywriting

- Write like a strong product marketer with operational literacy.
- Prefer concrete value over generic claims.
- Speak to farms, operators, and buyers directly.
- Avoid phrases that sound machine-generated, over-explained, or self-congratulatory.
- Public pages should sell clarity, trust, and control.
- Portal copy should guide the next action in plain language.

## Layout

- Build pages in clear horizontal bands with generous spacing.
- Use one dominant idea per section.
- Keep scan paths obvious on desktop and mobile.
- On mobile, stack content without losing priority or context.
- Do not put cards inside cards unless the inner item is a repeated data object.

## Public site rules

- Default to light mode.
- Keep navigation short: Home, About, Features, Farms, Products.
- Link operational entry points to the login page or onboarding where appropriate.
- Use large, high-quality photos near the top of major pages.
- Public pages should emphasize:
  - real farms
  - current products
  - traceability
  - operational credibility behind the catalog

## Portal rules

- Favor clarity over novelty.
- The sidebar should behave as a controlled navigation tree with one open category at a time.
- Surface key actions early on each page.
- Forms should explain prerequisites before users hit empty states.
- Required workflows should expose help hints where users may hesitate.
- Loading states should be brief, immediate, and non-blocking when possible.

## Forms and data entry

- The first-run experience matters disproportionately. Empty dropdowns must explain how to create prerequisite data.
- Keep labels direct and short.
- Group related inputs in the same visual block.
- Put help where the decision happens, not in a distant documentation section.
- Show disabled states only when the reason is obvious.

## Components

- Primary buttons: green, high-contrast, slightly elevated.
- Secondary buttons: bordered surface buttons with subtle hover lift.
- Panels: soft shadow, crisp border, consistent padding.
- Tables: quiet headers, clear row hover, no heavy chrome.
- KPI cards: one number, one label, one line of context.
- Empty states: explain what is missing and provide a direct next step.

## Responsive behavior

- Mobile is not a reduced experience; it is a reordered one.
- Navigation becomes drawers.
- Headers stay compact and action-oriented.
- Text must wrap cleanly without collision.
- Grids should collapse predictably: 4 -> 2 -> 1, or 3 -> 1 depending on content density.

## Performance

- Keep client-side work light unless interaction requires it.
- Prefer server-rendered public content where practical.
- Avoid deliberate loading delays.
- Use imagery intentionally and size it responsibly.
- Reuse shared surface and typography classes instead of page-specific one-offs where possible.

## Future additions

When adding new pages or modules, match these checks:

- Is the primary action obvious?
- Is the hierarchy readable in five seconds?
- Does the copy sound like a person wrote it?
- Does the mobile layout preserve the same workflow?
- Does the page belong visually to both the public brand and the operational product family?
