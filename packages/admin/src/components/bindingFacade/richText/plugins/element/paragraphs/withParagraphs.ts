import { createElement } from 'react'
import { Editor, Element as SlateElement, Node as SlateNode, Point, Range as SlateRange, Transforms } from 'slate'
import type { BaseEditor, ElementNode, ElementSpecifics, WithAnotherNodeType } from '../../../baseEditor'
import { ContemberEditor } from '../../../ContemberEditor'
import type { EditorWithParagraphs, WithParagraphs } from './EditorWithParagraphs'
import { ParagraphElement, paragraphElementType } from './ParagraphElement'
import { ParagraphRenderer, ParagraphRendererProps } from './ParagraphRenderer'

export const withParagraphs = <E extends BaseEditor>(editor: E): EditorWithParagraphs<E> => {
	const e: E & Partial<WithParagraphs<WithAnotherNodeType<E, ParagraphElement>>> = editor
	const {
		canContainAnyBlocks,
		canToggleElement,
		normalizeNode,
		renderElement,
		toggleElement,
		deleteBackward,
		processBlockPaste,
	} = editor

	const isParagraph = (
		element: ElementNode | SlateNode,
		suchThat?: Partial<ElementSpecifics<ParagraphElement>>,
	): element is ParagraphElement => ContemberEditor.isElementType(element, paragraphElementType, suchThat)

	e.isParagraph = isParagraph

	e.canToggleElement = (elementType, suchThat) => {
		// This only allows numbered paragraphs at the top level.
		// TODO this is pretty bad but in order to fix this, we'd also have to fix toggleElement and there's no time now.

		if (elementType !== paragraphElementType || suchThat === undefined) {
			return canToggleElement(elementType, suchThat)
		}
		const isNumbered = (suchThat as Partial<ElementSpecifics<ParagraphElement>>).isNumbered

		if (isNumbered !== true) {
			return canToggleElement(elementType, suchThat)
		}

		if (!editor.selection) {
			return false
		}
		const closestBlockEntry = ContemberEditor.closestBlockEntry(editor)
		if (closestBlockEntry === undefined) {
			return true
		}
		const [closestBlockElement, closestBlockPath] = closestBlockEntry

		return closestBlockPath.length === 1 &&  SlateElement.isElement(closestBlockElement) && closestBlockElement.type === paragraphElementType
	}

	e.toggleElement = (elementType, suchThat) => {
		if (elementType === paragraphElementType) {
			Editor.withoutNormalizing(e, () => {
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
			return createElement(ParagraphRenderer, props as ParagraphRendererProps)
		}
		return renderElement(props)
	}

	e.canContainAnyBlocks = element => (element.type === paragraphElementType ? false : canContainAnyBlocks(element))

	e.deleteBackward = unit => {
		const selection = e.selection
		if (unit !== 'character' || !selection || !SlateRange.isCollapsed(selection) || selection.focus.offset !== 0) {
			return deleteBackward(unit)
		}
		// The offset being zero doesn't necessarily imply that selection refers to the start of a paragraph.
		// It's just a way to early-exit.

		const closestNumberedEntry = Editor.above<ParagraphElement>(e, {
			match: node => SlateElement.isElement(node) && isParagraph(node, { isNumbered: true }),
		})
		if (closestNumberedEntry === undefined) {
			return deleteBackward(unit)
		}
		const [, paragraphPath] = closestNumberedEntry
		const paragraphStartPoint = Editor.start(editor, paragraphPath)

		if (!Point.equals(paragraphStartPoint, selection.focus)) {
			return deleteBackward(unit)
		}
		Transforms.setNodes(
			editor,
			{ isNumbered: null }, // null removes the key altogether
			{ at: paragraphPath },
		)
	}

	e.normalizeNode = entry => {
		const [node, path] = entry

		if (!SlateElement.isElement(node) || !e.isParagraph!(node)) {
			return normalizeNode(entry)
		}
		for (const [i, child] of node.children.entries()) {
			if (Editor.isBlock(editor, child)) {
				return Transforms.unwrapNodes(e, { at: [...path, i] })
			}
		}
		normalizeNode(entry)
	}

	e.processBlockPaste = (element, next, cumulativeTextAttrs) => {
		if (element.nodeName === 'P') {
			return { type: paragraphElementType, children: next(element.childNodes, cumulativeTextAttrs) }
		}
		return processBlockPaste(element, next, cumulativeTextAttrs)
	}

	return e as EditorWithParagraphs<E>
}
