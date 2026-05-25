import { getCollection } from 'pletivo/content'
import DocLayout, { type DocLayoutProps } from '../components/DocLayout'
import { extractToc } from '../lib/toc'
import { buildDocIndex, docHref, docTitle } from '../lib/docs'
import { flattenDocs, breadcrumbTrail } from '../lib/nav'

export async function getStaticPaths() {
	const entries = await getCollection('docs')
	const byId = buildDocIndex(entries)
	const order = flattenDocs()

	const paths = []
	for (const entry of entries) {
		const href = docHref(entry)
		if (href === '/') continue // homepage is served by index.tsx

		const { html } = await entry.render()
		const maxDepth = typeof entry.data.toc_max_heading_level === 'number' ? entry.data.toc_max_heading_level : 3
		const toc = extractToc(html, maxDepth)

		const idx = order.indexOf(entry.id)
		const prev = idx > 0 ? byId.get(order[idx - 1]) : undefined
		const next = idx >= 0 && idx < order.length - 1 ? byId.get(order[idx + 1]) : undefined
		const trail = breadcrumbTrail(entry.id) ?? []

		const props: DocLayoutProps = {
			title: docTitle(entry),
			description: typeof entry.data.description === 'string' ? entry.data.description : undefined,
			html,
			docId: entry.id,
			toc,
			byId,
			prev,
			next,
			trail,
		}
		paths.push({ params: { slug: href.replace(/^\//, '') }, props })
	}
	return paths
}

export default function DocPage(props: DocLayoutProps) {
	return <DocLayout {...props} />
}
