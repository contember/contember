import type { BaseEditor, CustomElementPlugin, ElementNode } from '../../../baseEditor'
import { Editor, Node as SlateNode, Transforms } from 'slate'
import { ElementSpecifics } from '../../../baseEditor'
import { ContemberEditor } from '../../../ContemberEditor'
import { ParagraphRenderer } from './ParagraphRenderer'

export const paragraphElementType = 'paragraph' as const

export interface ParagraphElement extends ElementNode {
	type: typeof paragraphElementType
	isNumbered?: boolean
	children: BaseEditor['children']
}

export const isParagraphElement = (
	element: ElementNode | SlateNode,
	suchThat?: Partial<ElementSpecifics<ParagraphElement>>,
): element is ParagraphElement => ContemberEditor.isElementType(element, paragraphElementType, suchThat)

export const paragraphElementPlugin: CustomElementPlugin<ParagraphElement> = {
	type: paragraphElementType,
	render: ParagraphRenderer,
	canContainAnyBlocks: false,
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
	normalizeNode: ({ editor, element, path }) => {
		for (const [i, child] of element.children.entries()) {
			if (Editor.isBlock(editor, child)) {
				return Transforms.unwrapNodes(editor, { at: [...path, i] })
			}
		}
	},
}
