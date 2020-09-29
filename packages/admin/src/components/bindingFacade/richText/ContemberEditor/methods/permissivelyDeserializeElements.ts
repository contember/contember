import { BaseEditor, ElementNode, TextNode } from '../../baseEditor'
import { Text as SlateText } from 'slate'
import { toLatestFormat } from './toLatestFormat'

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
			const targetElements: ElementNode[] = SlateText.isText(children[0])
				? [editor.createDefaultElement(children)]
				: (children as ElementNode[])

			return toLatestFormat(editor, {
				formatVersion: deserialized.formatVersion,
				children: targetElements,
			}).children
		}
		return [deserialized]
	} catch (e) {
		return [editor.createDefaultElement([{ text: serializedElement }])]
	}
}
