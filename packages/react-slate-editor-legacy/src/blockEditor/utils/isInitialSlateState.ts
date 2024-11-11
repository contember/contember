import { Descendant, Element as SlateElement, Text as SlateText } from 'slate'

export const isInitialSlateState = (children: Descendant[]): boolean => {
	return children.length === 1
		&& SlateElement.isElement(children[0])
		&& children[0].type === 'paragraph'
		&& children[0].children.length === 1
		&& SlateText.isText(children[0].children[0])
		&& children[0].children[0].text === ''
}
