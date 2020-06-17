import { BaseEditor, ElementNode, TextNode } from '../baseEditor'
import { Text as SlateText } from 'slate'

export const permissivelyDeserializeElements = <E extends BaseEditor>(
	editor: E,
	serializedElement: string,
	errorMessage?: string,
): ElementNode[] => {
	try {
		const deserialized:
			| {
					formatVersion: number
					children: ElementNode[] | TextNode[]
			  }
			| ElementNode = JSON.parse(serializedElement)

		if ('formatVersion' in deserialized) {
			const children = deserialized.children

			if (SlateText.isText(children[0])) {
				return [editor.createDefaultElement(children)]
			}
			return children as ElementNode[]
		}
		return [deserialized]
	} catch (e) {
		return [editor.createDefaultElement([{ text: serializedElement }])]
	}
}
