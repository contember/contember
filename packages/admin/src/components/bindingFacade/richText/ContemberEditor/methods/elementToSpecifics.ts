import type { ElementNode, ElementSpecifics } from '../../baseEditor'

export const elementToSpecifics = <Element extends ElementNode = ElementNode>(
	element: Element,
): ElementSpecifics<Element> => {
	const { type, children, referenceId, ...specifics } = element
	return specifics
}
