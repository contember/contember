import { getCollection } from 'pletivo/content'
import DocLayout from '../components/DocLayout'
import { extractToc } from '../lib/toc'
import { buildDocIndex, docHref, docTitle } from '../lib/docs'
import { flattenDocs, breadcrumbTrail } from '../lib/nav'

/** Homepage renders the doc whose frontmatter sets `slug: /` (intro/introduction). */
export default async function Home() {
	const entries = await getCollection('docs')
	const byId = buildDocIndex(entries)
	const home = entries.find((entry) => docHref(entry) === '/')
	if (!home) throw new Error('No doc with `slug: /` found for the homepage')

	const { html } = await home.render()
	const maxDepth = typeof home.data.toc_max_heading_level === 'number' ? home.data.toc_max_heading_level : 3
	const toc = extractToc(html, maxDepth)

	const order = flattenDocs()
	const idx = order.indexOf(home.id)
	const prev = idx > 0 ? byId.get(order[idx - 1]) : undefined
	const next = idx >= 0 && idx < order.length - 1 ? byId.get(order[idx + 1]) : undefined
	const trail = breadcrumbTrail(home.id) ?? []

	return (
		<DocLayout
			title={docTitle(home)}
			description={typeof home.data.description === 'string' ? home.data.description : undefined}
			html={html}
			docId={home.id}
			toc={toc}
			byId={byId}
			prev={prev}
			next={next}
			trail={trail}
		/>
	)
}
