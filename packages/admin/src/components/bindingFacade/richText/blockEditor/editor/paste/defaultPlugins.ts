import { PastePlugin } from './plugin'

const ignoredElements = ['SCRIPT', 'STYLE', 'TEMPLATE']

export const defaultPastePlugins: Partial<PastePlugin> = {
	blockProcessors: [
		(element, next, cumulativeTextAttrs) => {
			return ignoredElements.includes(element.tagName) ? [] : undefined
		},
	],
	inlineProcessors: [
		(element, next, cumulativeTextAttrs) => {
			return ignoredElements.includes(element.tagName) ? [] : undefined
		},
		(element, next, cumulativeTextAttrs) => {
			return element.tagName === 'BR' ? { text: '\n' } : undefined
		},
	],
}
