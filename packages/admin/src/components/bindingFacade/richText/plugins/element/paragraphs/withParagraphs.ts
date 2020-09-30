import * as React from 'react'
import { Editor as SlateEditor, Node as SlateNode, Transforms } from 'slate'
import { BaseEditor, ElementNode, ElementSpecifics, WithAnotherNodeType } from '../../../baseEditor'
import { ContemberEditor } from '../../../ContemberEditor'
import { EditorWithParagraphs, WithParagraphs } from './EditorWithParagraphs'
import { ParagraphElement, paragraphElementType } from './ParagraphElement'
import { ParagraphRenderer, ParagraphRendererProps } from './ParagraphRenderer'

export const withParagraphs = <E extends BaseEditor>(editor: E): EditorWithParagraphs<E> => {
	const e: E & Partial<WithParagraphs<WithAnotherNodeType<E, ParagraphElement>>> = editor
	const { renderElement, toggleElement } = editor

	const isParagraph = (
		element: ElementNode | SlateNode,
		suchThat?: Partial<ElementSpecifics<ParagraphElement>>,
	): element is ParagraphElement => ContemberEditor.isElementType(element, paragraphElementType, suchThat)

	e.isParagraph = isParagraph

	e.toggleElement = (elementType, suchThat) => {
		if (elementType === paragraphElementType) {
			SlateEditor.withoutNormalizing(e, () => {
				const topLevelNodes = Array.from(ContemberEditor.topLevelNodes(e))

				if (topLevelNodes.every(([node]) => isParagraph(node, suchThat))) {
					for (const [, path] of topLevelNodes) {
						ContemberEditor.ejectElement(e, path)
						Transforms.setNodes(e, { type: e.defaultElementType }, { at: path })
					}
				} else {
					for (const [node, path] of topLevelNodes) {
						if (isParagraph(node, suchThat)) {
							continue
						}
						ContemberEditor.ejectElement(e, path)
						const newProps: Partial<ParagraphElement> = {
							...suchThat,
							type: paragraphElementType,
						}
						Transforms.setNodes(e, newProps, { at: path })
					}
				}
			})
		}
		return toggleElement(elementType, suchThat)
	}

	e.renderElement = props => {
		if (isParagraph(props.element)) {
			return React.createElement(ParagraphRenderer, props as ParagraphRendererProps)
		}
		return renderElement(props)
	}

	return e as EditorWithParagraphs<E>
}
