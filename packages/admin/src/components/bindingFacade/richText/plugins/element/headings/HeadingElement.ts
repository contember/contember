import type { CustomElementPlugin } from '../../../baseEditor'
import { Editor, Editor as SlateEditor, Element, Node as SlateNode, Path as SlatePath, Transforms } from 'slate'
import { ContemberEditor } from '../../../ContemberEditor'
import { HeadingRenderer } from './HeadingRenderer'

export const headingElementType = 'heading' as const

export interface HeadingElement extends Element {
	type: typeof headingElementType
	level: 1 | 2 | 3 | 4 | 5 | 6
	isNumbered?: boolean
	children: SlateEditor['children']
}

export const isHeadingElement = (
	element: SlateNode,
	suchThat?: Partial<HeadingElement>,
): element is HeadingElement => ContemberEditor.isElementType(element, headingElementType, suchThat)

export const ejectHeadingElement = (editor: Editor, elementPath: SlatePath) => {
	ContemberEditor.ejectElement(editor, elementPath)
	Transforms.setNodes(editor, { type: editor.defaultElementType }, { at: elementPath })
}


export const headingElementPlugin: CustomElementPlugin<HeadingElement> = {
	type: headingElementType,
	render: HeadingRenderer,
	canContainAnyBlocks: false,
	// TODO in the following function, we need to conditionally trim the selection so that it doesn't potentially
	// 	include empty strings at the edges of top-level elements.
	toggleElement: ({ editor, suchThat }) => {
		SlateEditor.withoutNormalizing(editor, () => {
			const topLevelNodes = Array.from(ContemberEditor.topLevelNodes(editor))

			if (topLevelNodes.every(([node]) => isHeadingElement(node, suchThat))) {
				for (const [, path] of topLevelNodes) {
					ejectHeadingElement(editor, path)
				}
			} else {
				for (const [node, path] of topLevelNodes) {
					if (isHeadingElement(node, suchThat)) {
						continue
					}
					ContemberEditor.ejectElement(editor, path)
					const newProps: Partial<HeadingElement> = {
						...suchThat,
						type: headingElementType,
					}
					Transforms.setNodes(editor, newProps, {
						at: path,
					})
				}
			}
		})
	},
}
