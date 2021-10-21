import { Element as SlateElement } from 'slate'

export const elementToSpecifics = <Element extends SlateElement = SlateElement>(
	element: Element,
): Partial<Element> => {
	const { type, children, referenceId, ...specifics } = element
	return specifics as Partial<Element>
}
