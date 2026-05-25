import type { CollectionEntry } from 'pletivo/content'

export interface DocMeta {
	id: string
	title: string
	href: string
}

/** Route for a doc entry. Honors a frontmatter `slug` override (Docusaurus parity). */
export function docHref(entry: Pick<CollectionEntry, 'id' | 'data'>): string {
	const slug = entry.data?.slug
	if (typeof slug === 'string') return slug.startsWith('/') ? slug : `/${slug}`
	return `/${entry.id}`
}

/** Page title: frontmatter `title`, falling back to the last path segment. */
export function docTitle(entry: Pick<CollectionEntry, 'id' | 'data'>): string {
	const title = entry.data?.title
	return typeof title === 'string' && title ? title : entry.id.split('/').pop()!
}

/** Build an id → { title, href } lookup used by the sidebar, breadcrumbs and prev/next. */
export function buildDocIndex(entries: CollectionEntry[]): Map<string, DocMeta> {
	const byId = new Map<string, DocMeta>()
	for (const entry of entries) {
		byId.set(entry.id, { id: entry.id, title: docTitle(entry), href: docHref(entry) })
	}
	return byId
}
