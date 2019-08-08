import { Rule } from 'slate-html-serializer'
import { Text, TextJSON } from 'slate'

export const createSpanWithStyleRule = (mark: string, checkStyle: (_: CSSStyleDeclaration) => boolean): Rule => {
	const processed = new WeakSet()
	return {
		deserialize(el: Element, next) {
			if (el.tagName && el.tagName.toLowerCase() === 'span' && !processed.has(el)) {
				const htmlEl = el as HTMLElement

				if (checkStyle(htmlEl.style)) {
					processed.add(el)
					return {
						object: 'mark',
						type: mark,
						data: {},
						nodes: next([el])
					}
				}
			}
		},

		serialize(obj, children) {
			return undefined
		}
	}
}

export const TEXT_HTML_RULE: Rule = {
	deserialize(el: Element): TextJSON | undefined {
		if (el.tagName && el.tagName.toLowerCase() === 'br') {
			return Text.create('\n').toJSON()
		}

		if (el.nodeName === '#text') {
			if (el.nodeValue && el.nodeValue.match(/<!--.*?-->/)) return
			const str = (el.nodeValue || '').replace(/\n/g, '')
			return Text.create(str).toJSON()
		}
	},

	serialize(obj, children) {
		return undefined
	}
}
