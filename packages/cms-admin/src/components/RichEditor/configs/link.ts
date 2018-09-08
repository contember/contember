import { Config, simpleMarkPlugin, simpleMarkRule } from './utils'
import { Change, Value } from 'slate'

/**
 * A change helper to standardize wrapping links.
 */
const wrapLink = (href: string) => (change: Change) =>
	change.addMark({
		type: 'link',
		data: { href }
	})

/**
 * A change helper to standardize unwrapping links.
 */
const unwrapLink = () => (change: Change) => change.removeMark('link')

export const LINK: Config = {
	node: 'mark',
	type: 'link',
	plugin: simpleMarkPlugin('link', 'a', ['href']),
	htmlSerializer: simpleMarkRule('link', 'a', ['href']),
	onToggle: (value: Value) => {
		const hasLinks = value.activeMarks.some(mark => mark !== undefined && mark.type == 'link')
		const change = value.change()

		if (hasLinks) {
			change.call(unwrapLink())
		} else if (value.selection.isExpanded) {
			const href = window.prompt('Enter the URL of the link:')
			if (href) {
				change.call(wrapLink(href))
			}
		} else {
			const href = window.prompt('Enter the URL of the link:')
			const text = window.prompt('Enter the text for the link:')

			if (href && text) {
				change
					.insertText(text)
					.moveFocusBackward(text.length)
					.call(wrapLink(href))
			}
		}

		return change
	}
}
