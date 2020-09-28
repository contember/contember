import { Element as SlateElement, Node as SlateNode } from 'slate'
import { ElementNode, ElementSpecifics } from '../../baseEditor'

export const isElementType = <Element extends ElementNode>(
	element: SlateNode | ElementNode,
	type: Element['type'],
	suchThat?: ElementSpecifics<Element>,
): boolean => {
	if (!SlateElement.isElement(element) || element.type !== type) {
		return false
	}
	if (suchThat === undefined) {
		return true
	}

	for (const prop in suchThat) {
		const propValue = suchThat[prop as keyof ElementSpecifics<Element>]
		const propPresent = prop in element

		if (!propValue && !propPresent) {
			// Falsy values get special treatment.
			continue
		}

		if (!propPresent || (element as Element)[prop as keyof Element] !== propValue) {
			return false
		}
	}
	return true
}
