import type { CustomElementPlugin } from '../../../baseEditor'
import { Editor as SlateEditor, Editor, Element as SlateElement, Node as SlateNode, Transforms } from 'slate'
import { ContemberEditor } from '../../../ContemberEditor'
import { ParagraphRenderer } from './ParagraphRenderer'
import { AlignDirection } from '../../attributes'

export const paragraphElementType = 'paragraph' as const

export interface ParagraphElement extends SlateElement {
	type: typeof paragraphElementType
	isNumbered?: boolean
	children: SlateEditor['children']
	align?: AlignDirection
}

export const isParagraphElement = (
	element: SlateNode,
	suchThat?: Partial<ParagraphElement>,
): element is ParagraphElement => ContemberEditor.isElementType(element, paragraphElementType, suchThat)

export const paragraphElementPlugin: CustomElementPlugin<ParagraphElement> = {
	type: paragraphElementType,
	render: ParagraphRenderer,
	canContainAnyBlocks: false,
	acceptsAttributes: ({ editor, suchThat }) => {
		return 'align' in suchThat
	},
	toggleElement: ({ editor, suchThat }) => {
		Editor.withoutNormalizing(editor, () => {
			const topLevelNodes = Array.from(ContemberEditor.topLevelNodes(editor))

			if (topLevelNodes.every(([node]) => isParagraphElement(node, suchThat))) {
				for (const [, path] of topLevelNodes) {
					ContemberEditor.ejectElement(editor, path)
					Transforms.setNodes(editor, { type: editor.defaultElementType }, { at: path })
				}
			} else {
				for (const [node, path] of topLevelNodes) {
					if (isParagraphElement(node, suchThat)) {
						continue
					}
					ContemberEditor.ejectElement(editor, path)
					const newProps: Partial<ParagraphElement> = {
						...suchThat,
						type: paragraphElementType,
					}
					Transforms.setNodes(editor, newProps, { at: path })
				}
			}
		})
	},
	normalizeNode: ({ editor, element, path, preventDefault }) => {
		for (const [i, child] of element.children.entries()) {
			if (Editor.isBlock(editor, child)) {
				Transforms.unwrapNodes(editor, { at: [...path, i] })
				return preventDefault()
			}
		}
	},
}
