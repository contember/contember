import { Scalar } from '@contember/binding'
import { ElementNode } from '../../baseEditor'

export type ElementDataAttributes = {
	[dataAttribute: string]: Scalar
}

export const getElementDataAttributes = <Element extends ElementNode = ElementNode>(
	element: Element,
	attributeNamePrefix: string = 'contember',
): ElementDataAttributes => {
	const { children, ...extendedSpecifics } = element

	return Object.fromEntries(
		Object.entries(extendedSpecifics).map(([attribute, value]) => [
			`data-${attributeNamePrefix}-${attribute}`,
			value as Scalar,
		]),
	)
}
