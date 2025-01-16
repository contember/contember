---
title: Contember Headless Components
---

Headless components in Contember are published as **npm packages** that provide all the **core logic**—data retrieval, filtering, sorting, pagination, etc.—but **no pre-defined styling or layout**. They function as low-level building blocks, letting you craft **entirely custom UIs** that match your design system and workflows.

You’ll find headless versions of many features, such as a **DataView** that handles retrieving and managing items from the database, or forms that handle validation without imposing layout rules. These headless packages are ideal for teams that:

- Already have a **custom design system** or prefer a specific UI framework.
- Need **ultimate flexibility** in how data or forms are displayed.
- Don’t want to be constrained by a pre-built layout or styling decisions.

Because these components are entirely **presentationally agnostic**, you can wire them up to **any** UI of your choosing—tables, cards, modals, or something completely different. They allow you to:

- Decide your own markup structure.
- Bring in any CSS, styling library, or design tokens you need.
- Implement sophisticated interactions without fighting a “black box” UI layer.

> **Looking for a Pre-Styled Solution?**  
> In addition to headless packages, Contember also offers [**UI Components**](../ui-components/overview). Those are copied into your project with **Tailwind + Shadcn** styling already applied. If you want a ready-to-use, opinionated layout you can still modify, check out the **UI Components** overview.
