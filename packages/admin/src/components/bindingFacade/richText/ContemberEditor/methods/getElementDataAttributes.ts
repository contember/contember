import type { Scalar } from '@contember/react-binding'
import { Element as SlateElement } from 'slate'

export interface ElementDataAttributes {
	[dataAttribute: string]: Scalar
}

export const getElementDataAttributes = <Element extends SlateElement = SlateElement>(
	element: Element,
	attributeNamePrefix: string = 'contember',
): ElementDataAttributes => {
	const { children, ...extendedSpecifics } = element

	return Object.fromEntries(
		Object.entries(extendedSpecifics)
			.filter(([, value]) => {
				const t = typeof value
				return t === 'string' || t === 'number' || t === 'boolean'
			})
			.map(([attribute, value]) => [`data-${attributeNamePrefix}-${attribute.toLowerCase()}`, value as Scalar]),
	)
}
