import { visit } from 'unist-util-visit'
import type { Root } from 'mdast'

/**
 * Admonition types we recognise (Docusaurus parity). Anything else stays an
 * ordinary container directive and is left untouched.
 */
const TITLES: Record<string, string> = {
	note: 'Note',
	tip: 'Tip',
	info: 'Info',
	warning: 'Warning',
	caution: 'Caution',
	danger: 'Danger',
	important: 'Important',
}

/**
 * Remark plugin that turns container directives (`:::note`, `:::tip[Title]`, …)
 * into plain admonition markup:
 *
 *   <div class="admonition admonition-note">
 *     <div class="admonition-heading">…title…</div>
 *     …markdown content…
 *   </div>
 *
 * It emits HTML elements (via `data.hName`) rather than a JSX component, because
 * pletivo renders MDX with `mod.default({})` — no component provider — so an
 * `<Admonition>` identifier would be undefined. Plain divs styled by CSS sidestep
 * that entirely and need no per-file imports.
 *
 * The Docusaurus `:::note Some Title` syntax (trailing title text) is not valid
 * remark-directive; the migration step rewrites it to `:::note[Some Title]` so
 * the label is parsed here.
 */
export default function remarkAdmonitions() {
	return (tree: Root) => {
		visit(tree, 'containerDirective', (node: any) => {
			const name: string = node.name
			if (!(name in TITLES)) return

			// Pull out the optional label paragraph (the `[Title]` part).
			let headingChildren: any[] | null = null
			node.children = node.children.filter((child: any) => {
				if (child.data?.directiveLabel) {
					headingChildren = child.children
					return false
				}
				return true
			})

			const heading = {
				type: 'paragraph',
				data: { hName: 'div', hProperties: { className: ['admonition-heading'] } },
				children: headingChildren ?? [{ type: 'text', value: TITLES[name] }],
			}

			node.data = node.data || {}
			node.data.hName = 'div'
			node.data.hProperties = { className: ['admonition', `admonition-${name}`] }
			node.children.unshift(heading)
		})
	}
}
