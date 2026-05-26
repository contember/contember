export interface TocItem {
	id: string
	text: string
	depth: number
}

const HEADING_RE = /<h([2-6])\b([^>]*)>([\s\S]*?)<\/h\1>/g
const ID_RE = /\bid="([^"]+)"/

/**
 * Extract a table of contents from rendered HTML. Relies on `rehype-slug`
 * having added `id` attributes to headings. Strips inline markup from the
 * heading text and ignores headings deeper than `maxDepth`.
 */
export function extractToc(html: string, maxDepth = 3): TocItem[] {
	const items: TocItem[] = []
	let match: RegExpExecArray | null
	HEADING_RE.lastIndex = 0
	while ((match = HEADING_RE.exec(html))) {
		const depth = Number(match[1])
		if (depth > maxDepth) continue
		const idMatch = ID_RE.exec(match[2])
		if (!idMatch) continue
		const text = match[3].replace(/<[^>]+>/g, '').trim()
		if (!text) continue
		items.push({ id: idMatch[1], text, depth })
	}
	return items
}
