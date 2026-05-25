# Contember Documentation

A lightweight, Bun-powered docs site built with [Pletivo](https://github.com/contember/pletivo).
Content is plain Markdown/MDX; the theme (navbar, sidebar, table of contents,
admonitions, code highlighting, search) is a small set of JSX components — no
framework config beyond `pletivo.config.ts`.

## Develop

```bash
bun install
bun run dev      # dev server with HMR on http://localhost:3010
```

## Build

```bash
bun run build    # static output → build/
bun run serve    # preview the built site
```

## Structure

```
src/
  content/docs/        Markdown/MDX pages (the docs themselves)
  components/          Theme components (DocLayout, Sidebar, Toc, Navbar, …)
  lib/                 nav tree, doc lookups, TOC extraction, remark plugins
  pages/
    index.tsx          Homepage (renders the doc with `slug: /`)
    [...slug].tsx      Every other doc, by its content path
public/                Static assets (img/, assets/) and docs.css
pletivo.config.ts      MDX pipeline: admonitions, heading slugs, Shiki
```

### Authoring

- Add a `.mdx` file under `src/content/docs/` and reference it in `src/lib/nav.ts`
  to place it in the sidebar.
- Admonitions use the familiar `:::note`, `:::tip[Title]`, `:::caution`,
  `:::danger`, `:::important` syntax.
- Internal links are absolute and extensionless, e.g. `[ACL](/reference/engine/schema/acl)`.

### Search

Search uses Algolia DocSearch (`@docsearch/js` from the CDN) pointed at the
existing `docs-contember` index. The Algolia crawler is configured outside this
repo; it indexes the deployed HTML.
